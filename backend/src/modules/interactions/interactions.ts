import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { IPublicacionRepository } from '../posts';
import { INotificador } from '../notificaciones';

export const TIPOS_REACCION = ['me_gusta', 'fuerza', 'aplauso'] as const;
export type TipoReaccion = (typeof TIPOS_REACCION)[number];

export interface ResumenReacciones {
  total: number;
  miReaccion: TipoReaccion | null;
  porTipo: Record<string, number>;
}

export interface Comentario {
  id: number;
  publicacionId: number;
  texto: string;
  fecha: string;
  autor: { id: number; nombre: string; fotoPerfil: string | null };
}

export interface IReaccionRepository {
  obtener(publicacionId: number, usuarioId: number): Promise<TipoReaccion | null>;
  guardar(publicacionId: number, usuarioId: number, tipo: TipoReaccion): Promise<void>;
  quitar(publicacionId: number, usuarioId: number): Promise<void>;
  resumen(publicacionId: number, usuarioId: number): Promise<ResumenReacciones>;
}

export interface IComentarioRepository {
  crear(publicacionId: number, usuarioId: number, texto: string): Promise<Comentario>;
  listar(publicacionId: number): Promise<Comentario[]>;
  buscarPorId(id: number): Promise<{ id: number; usuarioId: number; publicacionId: number } | null>;
  eliminar(id: number): Promise<void>;
}

export const MAX_COMENTARIO = 500;

export class ReaccionService {
  constructor(private readonly reacciones: IReaccionRepository, private readonly publicaciones: IPublicacionRepository) {}

  async reaccionar(usuarioId: number, publicacionId: number, tipo: unknown): Promise<ResumenReacciones> {
    if (!TIPOS_REACCION.includes(tipo as TipoReaccion)) throw new ValidationError('Tipo de reacción inválido');
    if (!(await this.publicaciones.buscarPorId(publicacionId))) throw new NotFoundError('Publicación no encontrada');

    const actual = await this.reacciones.obtener(publicacionId, usuarioId);
    if (actual === tipo) await this.reacciones.quitar(publicacionId, usuarioId);
    else await this.reacciones.guardar(publicacionId, usuarioId, tipo as TipoReaccion);
    return this.reacciones.resumen(publicacionId, usuarioId);
  }
}

export class ComentarioService {
  constructor(
    private readonly comentarios: IComentarioRepository,
    private readonly publicaciones: IPublicacionRepository,
    private readonly notificador: INotificador,
  ) {}

  async crear(usuarioId: number, publicacionId: number, texto: unknown, nombreAutor: string): Promise<Comentario> {
    const limpio = typeof texto === 'string' ? texto.trim() : '';
    if (!limpio) throw new ValidationError('El comentario no puede estar vacío');
    if (limpio.length > MAX_COMENTARIO) throw new ValidationError(`El comentario no puede superar ${MAX_COMENTARIO} caracteres`);
    const pub = await this.publicaciones.buscarPorId(publicacionId);
    if (!pub) throw new NotFoundError('Publicación no encontrada');

    const creado = await this.comentarios.crear(publicacionId, usuarioId, limpio);
    if (pub.usuarioId !== usuarioId) {
      await this.notificador.notificar(pub.usuarioId, 'comentario', `${nombreAutor} comentó tu publicación`);
    }
    return creado;
  }

  async listar(publicacionId: number): Promise<Comentario[]> {
    if (!(await this.publicaciones.buscarPorId(publicacionId))) throw new NotFoundError('Publicación no encontrada');
    return this.comentarios.listar(publicacionId);
  }

  async eliminar(usuarioId: number, comentarioId: number): Promise<void> {
    const c = await this.comentarios.buscarPorId(comentarioId);
    if (!c) throw new NotFoundError('Comentario no encontrado');
    if (c.usuarioId !== usuarioId) throw new ForbiddenError('Solo puedes eliminar tus propios comentarios');
    await this.comentarios.eliminar(comentarioId);
  }
}
