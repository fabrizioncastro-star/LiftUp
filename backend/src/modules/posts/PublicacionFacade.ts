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

/**
 * Patrón FACADE (estructural): una sola puerta para publicar, editar y eliminar sesiones.
 * Oculta al controller la coordinación de: validar archivo -> guardarlo -> elegir la clase de
 * Publicacion (Factory Method) -> persistir en BD -> compensar si falla (borrar el archivo).
 * Dependencias por interfaz (DIP): repositorio y MediaFactory se inyectan.
 */
export class PublicacionFacade {
  constructor(private readonly repo: IPublicacionRepository, private readonly medios: MediaFactory) {}

  /** HU-005 esc. 1 y 2. */
  async publicar(usuarioId: number, archivo: ArchivoSubido | undefined, datos: DatosPublicacion): Promise<Publicacion> {
    if (!archivo) throw new ValidationError('Debes adjuntar una foto o un video');
    const tipo = this.medios.crearValidador().validar(archivo); // 'Formato no permitido'
    const descripcion = texto(datos.descripcion, MAX_DESCRIPCION, 'La descripción');
    const entrenamiento = this.parsearEntrenamiento(datos);

    const almacenamiento = this.medios.crearAlmacenamiento();
    const archivoUrl = await almacenamiento.guardar(archivo);
    try {
      const nueva = fabricaPara(tipo).crear({ usuarioId, descripcion, archivoUrl, ...entrenamiento });
      return await this.repo.crear(nueva);
    } catch (err) {
      await almacenamiento.eliminar(archivoUrl); // no dejar archivos huérfanos si falla la BD
      throw err;
    }
  }

  /** HU-005 esc. 3: solo el autor edita. */
  async editar(usuarioId: number, id: number, datos: DatosPublicacion): Promise<Publicacion> {
    const pub = await this.obtenerPropia(usuarioId, id, 'Solo puedes editar tus propias publicaciones');
    const descripcion = datos.descripcion === undefined
      ? pub.descripcion : texto(datos.descripcion, MAX_DESCRIPCION, 'La descripción');
    pub.editar(descripcion, this.parsearEntrenamiento(datos, pub.entrenamiento));
    await this.repo.actualizar(pub);
    return pub;
  }

  /** HU-005 esc. 4: solo el autor elimina. */
  async eliminar(usuarioId: number, id: number): Promise<void> {
    const pub = await this.obtenerPropia(usuarioId, id, 'Solo puedes eliminar tus propias publicaciones');
    await this.repo.eliminar(id);
    await this.medios.crearAlmacenamiento().eliminar(pub.archivoUrl);
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
