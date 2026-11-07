import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { INotificador } from '../notificaciones';
import { FeedItem, IFeedRepository } from '../posts';
import { PRIVACIDADES, Privacidad, estadoInicialDeSeguimiento, puedeVerContenido } from './reglasVisibilidad';

export type EstadoSeguimiento = 'pendiente' | 'aceptado';

export interface UsuarioBasico {
  id: number;
  nombre: string;
  fotoPerfil: string | null;
  nivelExperiencia: string;
  biografia: string | null;
  privacidad: Privacidad;
  estado: string;
}

export interface SeguimientoFila { id: number; seguidorId: number; seguidoId: number; estado: EstadoSeguimiento }

export interface SolicitudSeguimiento {
  id: number;
  fecha: string;
  seguidor: { id: number; nombre: string; fotoPerfil: string | null };
}

export interface ISeguimientoRepository {
  obtener(seguidorId: number, seguidoId: number): Promise<SeguimientoFila | null>;
  buscarPorId(id: number): Promise<SeguimientoFila | null>;
  crear(seguidorId: number, seguidoId: number, estado: EstadoSeguimiento): Promise<void>;
  eliminar(seguidorId: number, seguidoId: number): Promise<boolean>;
  eliminarPorId(id: number): Promise<void>;
  aceptar(id: number): Promise<void>;
  aceptarPendientesDe(seguidoId: number): Promise<void>;
  pendientesDe(seguidoId: number): Promise<SolicitudSeguimiento[]>;
  contar(usuarioId: number): Promise<{ seguidores: number; seguidos: number }>;
}

export interface IUsuarioSocialRepository {
  buscarBasico(id: number): Promise<UsuarioBasico | null>;
  buscarPorNombre(texto: string, excluirId: number, limite: number): Promise<UsuarioBasico[]>;
  actualizarPrivacidad(id: number, privacidad: Privacidad): Promise<void>;
}

export type Relacion = 'yo' | 'ninguna' | 'pendiente' | 'siguiendo';

export class SeguimientoService {
  constructor(
    private readonly seguimientos: ISeguimientoRepository,
    private readonly usuarios: IUsuarioSocialRepository,
    private readonly notificador: INotificador,
  ) {}

  async seguir(seguidorId: number, seguidoId: number): Promise<{ estado: EstadoSeguimiento }> {
    if (seguidorId === seguidoId) throw new ValidationError('No puedes seguirte a ti mismo');
    const destino = await this.usuarios.buscarBasico(seguidoId);
    if (!destino || destino.estado !== 'activo') throw new NotFoundError('Usuario no encontrado');

    const existente = await this.seguimientos.obtener(seguidorId, seguidoId);
    if (existente) return { estado: existente.estado };

    const estado = estadoInicialDeSeguimiento(destino.privacidad);
    await this.seguimientos.crear(seguidorId, seguidoId, estado);

    const yo = await this.usuarios.buscarBasico(seguidorId);
    const nombre = yo?.nombre ?? 'Alguien';
    await this.notificador.notificar(
      seguidoId,
      estado === 'pendiente' ? 'solicitud_seguimiento' : 'nuevo_seguidor',
      estado === 'pendiente' ? `${nombre} quiere seguirte` : `${nombre} empezó a seguirte`,
    );
    return { estado };
  }

  async dejarDeSeguir(seguidorId: number, seguidoId: number): Promise<void> {
    await this.seguimientos.eliminar(seguidorId, seguidoId);
  }

  solicitudesPendientes(usuarioId: number): Promise<SolicitudSeguimiento[]> {
    return this.seguimientos.pendientesDe(usuarioId);
  }

  async aceptarSolicitud(usuarioId: number, solicitudId: number): Promise<void> {
    const s = await this.solicitudPropia(usuarioId, solicitudId);
    await this.seguimientos.aceptar(s.id);
    const yo = await this.usuarios.buscarBasico(usuarioId);
    await this.notificador.notificar(s.seguidorId, 'solicitud_aceptada', `${yo?.nombre ?? 'Alguien'} aceptó tu solicitud de seguimiento`);
  }

  async rechazarSolicitud(usuarioId: number, solicitudId: number): Promise<void> {
    const s = await this.solicitudPropia(usuarioId, solicitudId);
    await this.seguimientos.eliminarPorId(s.id);
  }

  async cambiarPrivacidad(usuarioId: number, privacidad: unknown): Promise<Privacidad> {
    if (!PRIVACIDADES.includes(privacidad as Privacidad)) throw new ValidationError('Privacidad inválida');
    await this.usuarios.actualizarPrivacidad(usuarioId, privacidad as Privacidad);
    if (privacidad === 'publica') await this.seguimientos.aceptarPendientesDe(usuarioId);
    return privacidad as Privacidad;
  }

  private async solicitudPropia(usuarioId: number, solicitudId: number): Promise<SeguimientoFila> {
    const s = await this.seguimientos.buscarPorId(solicitudId);
    if (!s || s.estado !== 'pendiente') throw new NotFoundError('Solicitud no encontrada');
    if (s.seguidoId !== usuarioId) throw new ForbiddenError('Esta solicitud no es para ti');
    return s;
  }
}

export interface PerfilPublico {
  usuario: UsuarioBasico;
  seguidores: number;
  seguidos: number;
  relacion: Relacion;
  teSigue: boolean;
  puedeVerContenido: boolean;
  publicaciones: FeedItem[];
}

export class PerfilPublicoService {
  constructor(
    private readonly usuarios: IUsuarioSocialRepository,
    private readonly seguimientos: ISeguimientoRepository,
    private readonly feed: IFeedRepository,
  ) {}

  async verPerfil(espectadorId: number, usuarioId: number): Promise<PerfilPublico> {
    const usuario = await this.usuarios.buscarBasico(usuarioId);
    if (!usuario || usuario.estado !== 'activo') throw new NotFoundError('Usuario no encontrado');

    const [conteo, sigo, meSigue] = await Promise.all([
      this.seguimientos.contar(usuarioId),
      this.seguimientos.obtener(espectadorId, usuarioId),
      this.seguimientos.obtener(usuarioId, espectadorId),
    ]);
    const esElMismo = espectadorId === usuarioId;
    const visible = puedeVerContenido({
      privacidad: usuario.privacidad,
      esElMismo,
      espectadorSigueAlAutor: sigo?.estado === 'aceptado',
      autorSigueAlEspectador: meSigue?.estado === 'aceptado',
    });
    const relacion: Relacion = esElMismo ? 'yo' : !sigo ? 'ninguna' : sigo.estado === 'aceptado' ? 'siguiendo' : 'pendiente';
    return {
      usuario, ...conteo, relacion, teSigue: meSigue?.estado === 'aceptado', puedeVerContenido: visible,
      publicaciones: visible ? await this.feed.listarDeUsuario(espectadorId, usuarioId, 30) : [],
    };
  }

  async buscar(espectadorId: number, texto: unknown): Promise<UsuarioBasico[]> {
    const q = typeof texto === 'string' ? texto.trim() : '';
    if (q.length < 2) return [];
    return this.usuarios.buscarPorNombre(q, espectadorId, 20);
  }
}
