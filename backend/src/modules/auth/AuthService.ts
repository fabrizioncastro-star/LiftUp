import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors/AppError';
import { Usuario } from '../users/domain/Usuario';
import { IUsuarioRepository } from '../users/repository/IUsuarioRepository';
import { IPasswordHasher } from './domain/IPasswordHasher';
import { ISesionRepository } from './domain/ISesionRepository';
import { ITokenService } from './domain/ITokenService';
import { Sesion } from './domain/Sesion';
import { DatosRegistro, RegistroValidator } from './RegistroValidator';

export interface ResultadoAuth {
  token: string;
  usuario: ReturnType<Usuario['toPublico']>;
}

export interface DatosLogin {
  correo?: unknown;
  contrasena?: unknown;
}

const MSG_CREDENCIALES = 'Usuario o contraseña incorrectos';

export class AuthService {
  constructor(
    private readonly usuarios: IUsuarioRepository,
    private readonly sesiones: ISesionRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
    private readonly validator: RegistroValidator = new RegistroValidator(),
  ) {}

  async registrar(datos: DatosRegistro): Promise<ResultadoAuth> {
    const { nombre, correo, contrasena } = this.validator.validar(datos);

    if (await this.usuarios.buscarPorCorreo(correo)) {
      throw new ConflictError('Este correo ya está registrado');
    }

    const contrasenaHash = await this.hasher.hash(contrasena);
    const creado = await this.usuarios.crear(new Usuario({ nombre, correo, contrasenaHash }));
    return this.abrirSesion(creado);
  }

  async iniciarSesion(datos: DatosLogin): Promise<ResultadoAuth> {
    const correo = typeof datos.correo === 'string' ? datos.correo.trim().toLowerCase() : '';
    const contrasena = typeof datos.contrasena === 'string' ? datos.contrasena : '';
    if (!correo || !contrasena) throw new ValidationError('Correo y contraseña son obligatorios');

    const usuario = await this.usuarios.buscarPorCorreo(correo);
    if (!usuario || !(await this.hasher.comparar(contrasena, usuario.contrasenaHash))) {
      throw new UnauthorizedError(MSG_CREDENCIALES);
    }
    if (usuario.estado !== 'activo') throw new ForbiddenError('Esta cuenta no está activa');

    return this.abrirSesion(usuario);
  }

  async obtenerUsuario(id: number): Promise<ReturnType<Usuario['toPublico']>> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new NotFoundError('Usuario no encontrado');
    return usuario.toPublico();
  }

  async cerrarSesion(token: string): Promise<void> {
    await this.sesiones.eliminar(token);
  }

  private async abrirSesion(usuario: Usuario): Promise<ResultadoAuth> {
    const id = usuario.id as number;
    const token = this.tokens.firmar({ id, correo: usuario.correo, rol: usuario.rol });
    await this.sesiones.crear(new Sesion(id, token, this.tokens.calcularExpiracion()));
    return { token, usuario: usuario.toPublico() };
  }
}
