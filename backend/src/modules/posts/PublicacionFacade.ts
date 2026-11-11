import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { MediaFactory } from '../media/MediaFactory';
import { ArchivoSubido } from '../media/tipos';
import { DatosEntrenamiento, Publicacion } from './domain/Publicacion';
import { fabricaPara } from './domain/PublicacionFactory';
import { IPublicacionRepository } from './domain/IPublicacionRepository';

export interface DatosPublicacion {
  descripcion?: unknown;
  ejercicio?: unknown;
  pesoKg?: unknown;
  series?: unknown;
  repeticiones?: unknown;
}

export type ObservadorPublicacion = (usuarioId: number) => Promise<void>;

export const MAX_DESCRIPCION = 2000;

function texto(valor: unknown, max: number, campo: string): string | null {
  if (valor === undefined || valor === null) return null;
  const t = String(valor).trim();
  if (t.length > max) throw new ValidationError(`${campo} no puede superar ${max} caracteres`);
  return t || null;
}

function numero(valor: unknown, campo: string, entero: boolean): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0 || (entero && !Number.isInteger(n)) || n > 100000) {
    throw new ValidationError(`${campo} inválido`);
  }
  return n;
}

export class PublicacionFacade {
  constructor(
    private readonly repo: IPublicacionRepository,
    private readonly medios: MediaFactory,
    private readonly observadores: ObservadorPublicacion[] = [],
  ) {}

  async publicar(
    usuarioId: number, archivo: ArchivoSubido | undefined, datos: DatosPublicacion, comunidadId: number | null = null,
  ): Promise<Publicacion> {
    if (!archivo) throw new ValidationError('Debes adjuntar una foto o un video');
    const tipo = this.medios.crearValidador().validar(archivo);
    const descripcion = texto(datos.descripcion, MAX_DESCRIPCION, 'La descripción');
    const entrenamiento = this.parsearEntrenamiento(datos);

    const almacenamiento = this.medios.crearAlmacenamiento();
    const archivoUrl = await almacenamiento.guardar(archivo);
    let creada: Publicacion;
    try {
      const nueva = fabricaPara(tipo).crear({ usuarioId, comunidadId, descripcion, archivoUrl, ...entrenamiento });
      creada = await this.repo.crear(nueva);
    } catch (err) {
      await almacenamiento.eliminar(archivoUrl);
      throw err;
    }
    await this.avisar(usuarioId);
    return creada;
  }

  async editar(usuarioId: number, id: number, datos: DatosPublicacion): Promise<Publicacion> {
    const pub = await this.obtenerPropia(usuarioId, id, 'Solo puedes editar tus propias publicaciones');
    const descripcion = datos.descripcion === undefined
      ? pub.descripcion : texto(datos.descripcion, MAX_DESCRIPCION, 'La descripción');
    pub.editar(descripcion, this.parsearEntrenamiento(datos, pub.entrenamiento));
    await this.repo.actualizar(pub);
    return pub;
  }

  async eliminar(usuarioId: number, id: number): Promise<void> {
    const pub = await this.obtenerPropia(usuarioId, id, 'Solo puedes eliminar tus propias publicaciones');
    await this.borrar(pub);
  }

  async eliminarComoAdmin(id: number): Promise<{ autorId: number }> {
    const pub = await this.repo.buscarPorId(id);
    if (!pub) throw new NotFoundError('Publicación no encontrada');
    await this.borrar(pub);
    return { autorId: pub.usuarioId };
  }

  private async borrar(pub: Publicacion): Promise<void> {
    await this.repo.eliminar(pub.id as number);
    await this.medios.crearAlmacenamiento().eliminar(pub.archivoUrl);
  }

  private async avisar(usuarioId: number): Promise<void> {
    for (const observador of this.observadores) {
      try {
        await observador(usuarioId);
      } catch (err) {
        console.error('[LiftUp] Observador de publicación falló:', err);
      }
    }
  }

  private async obtenerPropia(usuarioId: number, id: number, mensajeAjeno: string): Promise<Publicacion> {
    const pub = await this.repo.buscarPorId(id);
    if (!pub) throw new NotFoundError('Publicación no encontrada');
    if (!pub.esDe(usuarioId)) throw new ForbiddenError(mensajeAjeno);
    return pub;
  }

  private parsearEntrenamiento(datos: DatosPublicacion, previo?: DatosEntrenamiento): DatosEntrenamiento {
    const dado = (k: keyof DatosPublicacion) => datos[k] !== undefined;
    return {
      ejercicio: dado('ejercicio') ? texto(datos.ejercicio, 150, 'El ejercicio') : previo?.ejercicio ?? null,
      pesoKg: dado('pesoKg') ? numero(datos.pesoKg, 'El peso', false) : previo?.pesoKg ?? null,
      series: dado('series') ? numero(datos.series, 'Las series', true) : previo?.series ?? null,
      repeticiones: dado('repeticiones') ? numero(datos.repeticiones, 'Las repeticiones', true) : previo?.repeticiones ?? null,
    };
  }
}
