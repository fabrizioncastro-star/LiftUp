import { RowDataPacket } from 'mysql2/promise';
import { Database } from '../../../config/Database';
import { ISesionRepository } from '../domain/ISesionRepository';
import { Sesion } from '../domain/Sesion';

export class SesionRepository implements ISesionRepository {
  private get pool() { return Database.getInstance().getPool(); }

  async crear(s: Sesion): Promise<void> {
    await this.pool.query(
      'INSERT INTO sesiones (usuario_id, token, fecha_expiracion) VALUES (?, ?, ?)',
      [s.usuarioId, s.token, s.fechaExpiracion],
    );
  }

  async eliminar(token: string): Promise<void> {
    await this.pool.query('DELETE FROM sesiones WHERE token = ?', [token]);
  }

  async existeVigente(token: string): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id FROM sesiones WHERE token = ? AND fecha_expiracion > NOW()', [token],
    );
    return rows.length > 0;
  }
}
