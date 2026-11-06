import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { ArchivoSubido } from '../media/tipos';
import { INotificador } from '../notificaciones';
import { DatosPublicacion, FeedItem, IFeedRepository, PublicacionFacade } from '../posts';

export interface Comunidad {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  miembros: number;
  esMiembro: boolean;
}

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';

export interface DatosSolicitud {
  nombre: string;
  tipo: string;
  descripcion: string | null;
}

export class SolicitudComunidad {
  constructor(
    public readonly id: number,
    public readonly usuarioId: number,
    public readonly datos: DatosSolicitud,
    private _estado: EstadoSolicitud = 'pendiente',
    public readonly fecha?: string,
  ) {}

  get estado(): EstadoSolicitud { return this._estado; }

  aprobar(): void { this.resolver('aprobada'); }
  rechazar(): void { this.resolver('rechazada'); }

  private resolver(nuevo: EstadoSolicitud): void {
    if (this._estado !== 'pendiente') throw new ConflictError('La solicitud ya fue resuelta');
    this._estado = nuevo;
  }
}

export interface SolicitudPendiente {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  fecha: string;
  solicitante: { id: number; nombre: string };
}

export interface ISolicitudRepository {
  crear(usuarioId: number, datos: DatosSolicitud): Promise<SolicitudComunidad>;
  buscarPorId(id: number): Promise<SolicitudComunidad | null>;
  guardarEstado(s: SolicitudComunidad): Promise<void>;
  existeNombre(nombre: string): Promise<boolean>;
  pendientes(): Promise<SolicitudPendiente[]>;
  delUsuario(usuarioId: number): Promise<SolicitudComunidad[]>;
}

export interface IComunidadRepository {
  listar(usuarioId: number, texto: string): Promise<Comunidad[]>;
  mias(usuarioId: number): Promise<Comunidad[]>;
  buscarPorId(id: number): Promise<{ id: number; nombre: string; estado: string } | null>;
  crear(datos: DatosSolicitud): Promise<number>;
  unir(comunidadId: number, usuarioId: number): Promise<void>;
  esMiembro(comunidadId: number, usuarioId: number): Promise<boolean>;
}

const MIN_NOMBRE = 3;

export class SolicitudService {
  constructor(
    private readonly solicitudes: ISolicitudRepository,
    private readonly comunidades: IComunidadRepository,
    private readonly notificador: INotificador,
  ) {}

  async crear(usuarioId: number, entrada: { nombre?: unknown; tipo?: unknown; descripcion?: unknown }): Promise<SolicitudComunidad> {
    const nombre = typeof entrada.nombre === 'string' ? entrada.nombre.trim() : '';
    const tipo = typeof entrada.tipo === 'string' ? entrada.tipo.trim() : '';
    const descripcion = typeof entrada.descripcion === 'string' ? entrada.descripcion.trim() : '';
    if (nombre.length < MIN_NOMBRE) throw new ValidationError(`El nombre debe tener al menos ${MIN_NOMBRE} caracteres`);
    if (nombre.length > 150) throw new ValidationError('El nombre no puede superar 150 caracteres');
    if (!tipo) throw new ValidationError('El tipo es obligatorio');
    if (descripcion.length > 500) throw new ValidationError('La descripción no puede superar 500 caracteres');

    if (await this.solicitudes.existeNombre(nombre)) throw new ConflictError('Ya existe una solicitud para esa comunidad');
    return this.solicitudes.crear(usuarioId, { nombre, tipo, descripcion: descripcion || null });
  }

  misSolicitudes(usuarioId: number): Promise<SolicitudComunidad[]> {
    return this.solicitudes.delUsuario(usuarioId);
  }

  pendientes(): Promise<SolicitudPendiente[]> {
    return this.solicitudes.pendientes();
  }

  async aprobar(solicitudId: number): Promise<{ comunidadId: number; nombre: string }> {
    const s = await this.cargar(solicitudId);
    s.aprobar();
    const comunidadId = await this.comunidades.crear(s.datos);
    await this.comunidades.unir(comunidadId, s.usuarioId);
    await this.solicitudes.guardarEstado(s);
    await this.notificador.notificar(s.usuarioId, 'comunidad_aprobada', `Tu comunidad "${s.datos.nombre}" fue aprobada`);
    return { comunidadId, nombre: s.datos.nombre };
  }

  async rechazar(solicitudId: number): Promise<{ nombre: string }> {
    const s = await this.cargar(solicitudId);
    s.rechazar();
    await this.solicitudes.guardarEstado(s);
    await this.notificador.notificar(s.usuarioId, 'comunidad_rechazada', `Tu solicitud de la comunidad "${s.datos.nombre}" fue rechazada`);
    return { nombre: s.datos.nombre };
  }

  private async cargar(id: number): Promise<SolicitudComunidad> {
    const s = await this.solicitudes.buscarPorId(id);
    if (!s) throw new NotFoundError('Solicitud no encontrada');
    return s;
  }
}
