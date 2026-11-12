import crypto from 'crypto';
import { AppError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { IUsuarioRepository } from '../users/repository/IUsuarioRepository';
import { IPasswordHasher } from './domain/IPasswordHasher';
import { ISesionRepository } from './domain/ISesionRepository';
import { MIN_CONTRASENA } from './RegistroValidator';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MSG_CODIGO = 'Código inválido o expirado';
const MAX_INTENTOS = 5;
const ESPERA_ENTRE_CODIGOS_MS = 30_000;

export interface IEnviadorCorreo {
  enviar(para: string, asunto: string, texto: string): Promise<void>;
}

export interface CodigoRecuperacion {
  id: number;
  codigoHash: string;
  expira: Date;
  intentos: number;
  creado: Date;
}

export interface ICodigoRecuperacionRepository {
  reemplazar(usuarioId: number, codigoHash: string, expira: Date): Promise<void>;
  vigente(usuarioId: number): Promise<CodigoRecuperacion | null>;
  registrarIntentoFallido(id: number): Promise<void>;
  marcarUsado(id: number): Promise<void>;
  eliminar(id: number): Promise<void>;
}

export class RecuperacionService {
  constructor(
    private readonly usuarios: IUsuarioRepository,
    private readonly codigos: ICodigoRecuperacionRepository,
    private readonly hasher: IPasswordHasher,
    private readonly correo: IEnviadorCorreo,
    private readonly sesiones: ISesionRepository,
    private readonly minutosValidez = 10,
    private readonly ahora: () => Date = () => new Date(),
    private readonly generarCodigo: () => string = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0'),
  ) {}

  async solicitarCodigo(entrada: unknown): Promise<void> {
    const correo = this.normalizar(entrada);
    if (!REGEX_CORREO.test(correo)) throw new ValidationError('Formato de correo inválido');
    const usuario = await this.usuarios.buscarPorCorreo(correo);
    if (!usuario) throw new NotFoundError('Este correo no está registrado');

    const id = usuario.id as number;
    const previo = await this.codigos.vigente(id);
    if (previo && this.ahora().getTime() - previo.creado.getTime() < ESPERA_ENTRE_CODIGOS_MS) {
      throw new AppError('Espera unos segundos antes de pedir otro código', 429);
    }

    const codigo = this.generarCodigo();
    const expira = new Date(this.ahora().getTime() + this.minutosValidez * 60_000);
    await this.codigos.reemplazar(id, await this.hasher.hash(codigo), expira);
    try {
      await this.correo.enviar(
        correo, 'Tu código de recuperación de LiftUp',
        `Tu código de recuperación es ${codigo}. Vence en ${this.minutosValidez} minutos. Si no lo pediste, ignora este mensaje.`,
      );
    } catch (err) {
      console.error('[LiftUp] No se pudo enviar el correo de recuperación:', err);
      const guardado = await this.codigos.vigente(id);
      if (guardado) await this.codigos.eliminar(guardado.id);
      throw new AppError('No se pudo enviar el correo. Intenta de nuevo en unos minutos', 502);
    }
  }

  async verificarCodigo(correoEntrada: unknown, codigo: unknown): Promise<void> {
    await this.validarCodigo(correoEntrada, codigo);
  }

  async restablecer(correoEntrada: unknown, codigo: unknown, nuevaContrasena: unknown): Promise<void> {
    const { usuarioId, codigoId } = await this.validarCodigo(correoEntrada, codigo);
    if (typeof nuevaContrasena !== 'string' || nuevaContrasena.length < MIN_CONTRASENA) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
    }
    await this.usuarios.actualizarContrasena(usuarioId, await this.hasher.hash(nuevaContrasena));
    await this.codigos.marcarUsado(codigoId);
    await this.sesiones.eliminarTodasDe(usuarioId);
  }

  private async validarCodigo(correoEntrada: unknown, codigo: unknown): Promise<{ usuarioId: number; codigoId: number }> {
    const correo = this.normalizar(correoEntrada);
    const usuario = correo ? await this.usuarios.buscarPorCorreo(correo) : null;
    const guardado = usuario ? await this.codigos.vigente(usuario.id as number) : null;
    if (!usuario || !guardado || typeof codigo !== 'string') throw new ValidationError(MSG_CODIGO);

    if (guardado.expira.getTime() <= this.ahora().getTime() || guardado.intentos >= MAX_INTENTOS) {
      throw new ValidationError(MSG_CODIGO);
    }
    if (!(await this.hasher.comparar(codigo.trim(), guardado.codigoHash))) {
      await this.codigos.registrarIntentoFallido(guardado.id);
      throw new ValidationError(MSG_CODIGO);
    }
    return { usuarioId: usuario.id as number, codigoId: guardado.id };
  }

  private normalizar(entrada: unknown): string {
    return typeof entrada === 'string' ? entrada.trim().toLowerCase() : '';
  }
}
