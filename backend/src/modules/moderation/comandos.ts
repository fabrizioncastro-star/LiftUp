import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError';
import { ISesionRepository } from '../auth/domain/ISesionRepository';
import { INotificador } from '../notificaciones';
import { PublicacionFacade } from '../posts';
import { SolicitudService } from '../communities';
import { IEstadoCuentaRepository } from '../users/repository/IUsuarioRepository';
import { IReporteRepository } from './reportes';

export interface IComandoAdmin {
  readonly accion: string;
  readonly objetivoTipo: string;
  readonly objetivoId: number;
  ejecutar(): Promise<string>;
}

export interface IHistorialRepository {
  registrar(adminId: number, accion: string, objetivoTipo: string, objetivoId: number, detalle: string): Promise<void>;
  listar(limite: number): Promise<{ id: number; admin: string; accion: string; objetivoTipo: string; objetivoId: number; detalle: string | null; fecha: string }[]>;
}

export class EjecutorDeComandos {
  constructor(private readonly historial: IHistorialRepository) {}

  async ejecutar(adminId: number, comando: IComandoAdmin): Promise<void> {
    const detalle = await comando.ejecutar();
    await this.historial.registrar(adminId, comando.accion, comando.objetivoTipo, comando.objetivoId, detalle);
  }
}

export class AprobarSolicitudComando implements IComandoAdmin {
  readonly accion = 'aprobar_solicitud_comunidad';
  readonly objetivoTipo = 'solicitud_comunidad';
  constructor(private readonly solicitudes: SolicitudService, readonly objetivoId: number) {}
  async ejecutar(): Promise<string> {
    const r = await this.solicitudes.aprobar(this.objetivoId);
    return `Comunidad "${r.nombre}" creada (id ${r.comunidadId})`;
  }
}

export class RechazarSolicitudComando implements IComandoAdmin {
  readonly accion = 'rechazar_solicitud_comunidad';
  readonly objetivoTipo = 'solicitud_comunidad';
  constructor(private readonly solicitudes: SolicitudService, readonly objetivoId: number) {}
  async ejecutar(): Promise<string> {
    const r = await this.solicitudes.rechazar(this.objetivoId);
    return `Solicitud de "${r.nombre}" rechazada`;
  }
}

export class EliminarPublicacionComando implements IComandoAdmin {
  readonly accion = 'eliminar_publicacion';
  readonly objetivoTipo = 'publicacion';
  constructor(
    private readonly publicaciones: PublicacionFacade,
    private readonly notificador: INotificador,
    private readonly reportes: IReporteRepository,
    readonly objetivoId: number,
  ) {}
  async ejecutar(): Promise<string> {
    const { autorId } = await this.publicaciones.eliminarComoAdmin(this.objetivoId);
    await this.reportes.marcarPorObjetivo('publicacion', this.objetivoId, 'revisado');
    await this.notificador.notificar(autorId, 'publicacion_eliminada', 'Tu publicación fue eliminada por incumplir las normas de la plataforma');
    return `Publicación ${this.objetivoId} eliminada; autor ${autorId} notificado`;
  }
}
