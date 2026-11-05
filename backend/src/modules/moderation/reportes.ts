import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { IPublicacionRepository } from '../posts';
import { IEstadoCuentaRepository } from '../users/repository/IUsuarioRepository';

export const MOTIVOS_REPORTE = ['contenido_ofensivo', 'spam', 'desinformacion', 'otro'] as const;
export type MotivoReporte = (typeof MOTIVOS_REPORTE)[number];
export type TipoObjetivo = 'publicacion' | 'usuario';
export type EstadoReporte = 'pendiente' | 'revisado' | 'descartado';

export interface ReportePendiente {
  id: number;
  tipo: TipoObjetivo;
  objetivoId: number;
  motivo: string;
  detalle: string | null;
  fecha: string;
  reportante: { id: number; nombre: string };
  publicacion: { id: number; descripcion: string | null; archivoUrl: string; tipoArchivo: string; autor: { id: number; nombre: string } } | null;
  usuario: { id: number; nombre: string; estado: string } | null;
}

export interface IReporteRepository {
  existe(reportanteId: number, tipo: TipoObjetivo, objetivoId: number): Promise<boolean>;
  crear(reportanteId: number, tipo: TipoObjetivo, objetivoId: number, motivo: MotivoReporte, detalle: string | null): Promise<void>;
  pendientes(): Promise<ReportePendiente[]>;
  marcar(id: number, estado: EstadoReporte): Promise<boolean>;
  marcarPorObjetivo(tipo: TipoObjetivo, objetivoId: number, estado: EstadoReporte): Promise<void>;
}

export class ReporteService {
  constructor(
    private readonly reportes: IReporteRepository,
    private readonly publicaciones: IPublicacionRepository,
    private readonly cuentas: IEstadoCuentaRepository,
  ) {}

  async reportarPublicacion(reportanteId: number, publicacionId: number, motivo: unknown, detalle: unknown): Promise<void> {
    const m = this.validarMotivo(motivo);
    const pub = await this.publicaciones.buscarPorId(publicacionId);
    if (!pub) throw new NotFoundError('Publicación no encontrada');
    if (pub.usuarioId === reportanteId) throw new ValidationError('No puedes reportar tu propio contenido');
    await this.registrar(reportanteId, 'publicacion', publicacionId, m, detalle, 'Ya reportaste esta publicación');
  }

  async reportarUsuario(reportanteId: number, usuarioId: number, motivo: unknown, detalle: unknown): Promise<void> {
    const m = this.validarMotivo(motivo);
    if (usuarioId === reportanteId) throw new ValidationError('No puedes reportarte a ti mismo');
    if (!(await this.cuentas.buscarPorId(usuarioId))) throw new NotFoundError('Usuario no encontrado');
    await this.registrar(reportanteId, 'usuario', usuarioId, m, detalle, 'Ya reportaste a este usuario');
  }

  private validarMotivo(motivo: unknown): MotivoReporte {
    if (!MOTIVOS_REPORTE.includes(motivo as MotivoReporte)) throw new ValidationError('Motivo de reporte inválido');
    return motivo as MotivoReporte;
  }

  private async registrar(
    reportanteId: number, tipo: TipoObjetivo, objetivoId: number, motivo: MotivoReporte, detalle: unknown, mensajeDuplicado: string,
  ): Promise<void> {
    const texto = typeof detalle === 'string' ? detalle.trim().slice(0, 500) : '';
    if (await this.reportes.existe(reportanteId, tipo, objetivoId)) throw new ConflictError(mensajeDuplicado);
    await this.reportes.crear(reportanteId, tipo, objetivoId, motivo, texto || null);
  }
}
