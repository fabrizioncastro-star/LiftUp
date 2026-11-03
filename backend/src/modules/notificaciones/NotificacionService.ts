import { INotificador } from './INotificador';

export interface Notificacion {
  id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
}

export interface INotificacionRepository {
  crear(usuarioId: number, tipo: string, mensaje: string): Promise<void>;
  listar(usuarioId: number, limite: number): Promise<Notificacion[]>;
  contarNoLeidas(usuarioId: number): Promise<number>;
  marcarTodasLeidas(usuarioId: number): Promise<void>;
}

export class NotificacionService implements INotificador {
  constructor(private readonly repo: INotificacionRepository) {}

  async notificar(usuarioId: number, tipo: string, mensaje: string): Promise<void> {
    await this.repo.crear(usuarioId, tipo, mensaje.slice(0, 300));
  }

  async listar(usuarioId: number): Promise<{ notificaciones: Notificacion[]; noLeidas: number }> {
    const [notificaciones, noLeidas] = await Promise.all([
      this.repo.listar(usuarioId, 50), this.repo.contarNoLeidas(usuarioId),
    ]);
    return { notificaciones, noLeidas };
  }

  contarNoLeidas(usuarioId: number): Promise<number> {
    return this.repo.contarNoLeidas(usuarioId);
  }

  marcarTodasLeidas(usuarioId: number): Promise<void> {
    return this.repo.marcarTodasLeidas(usuarioId);
  }
}
