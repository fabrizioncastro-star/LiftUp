import { RowDataPacket } from 'mysql2/promise';
import { Database } from '../../config/Database';
import { INotificacionRepository, Notificacion } from './NotificacionService';

export class NotificacionRepository implements INotificacionRepository {
  private get pool() { return Database.getInstance().getPool(); }

  async crear(usuarioId: number, tipo: string, mensaje: string): Promise<void> {
    await this.pool.query('INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, ?, ?)', [usuarioId, tipo, mensaje]);
  }

  async listar(usuarioId: number, limite: number): Promise<Notificacion[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id, tipo, mensaje, leida, fecha FROM notificaciones WHERE usuario_id = ? ORDER BY fecha DESC, id DESC LIMIT ?',
      [usuarioId, limite],
    );
    return rows.map((r) => ({ id: r.id, tipo: r.tipo, mensaje: r.mensaje, leida: Boolean(r.leida), fecha: new Date(r.fecha).toISOString() }));
  }

  async contarNoLeidas(usuarioId: number): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS n FROM notificaciones WHERE usuario_id = ? AND leida = 0', [usuarioId],
    );
    return Number(rows[0].n);
  }

  async marcarTodasLeidas(usuarioId: number): Promise<void> {
    await this.pool.query('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ? AND leida = 0', [usuarioId]);
  }
}
