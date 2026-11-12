import { RowDataPacket } from 'mysql2/promise';
import { Database } from '../../../config/Database';
import { CodigoRecuperacion, ICodigoRecuperacionRepository } from '../recuperacion';

export class CodigoRecuperacionRepository implements ICodigoRecuperacionRepository {
  private get pool() { return Database.getInstance().getPool(); }

  async reemplazar(usuarioId: number, codigoHash: string, expira: Date): Promise<void> {
    await this.pool.query('DELETE FROM codigos_recuperacion WHERE usuario_id = ?', [usuarioId]);
    await this.pool.query(
      'INSERT INTO codigos_recuperacion (usuario_id, codigo_hash, expira) VALUES (?, ?, ?)', [usuarioId, codigoHash, expira],
    );
  }

  async vigente(usuarioId: number): Promise<CodigoRecuperacion | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, codigo_hash, expira, intentos, fecha_creacion FROM codigos_recuperacion
        WHERE usuario_id = ? AND usado = 0 ORDER BY id DESC LIMIT 1`, [usuarioId],
    );
    const r = rows[0];
    return r ? { id: r.id, codigoHash: r.codigo_hash, expira: new Date(r.expira), intentos: r.intentos, creado: new Date(r.fecha_creacion) } : null;
  }

  async registrarIntentoFallido(id: number): Promise<void> {
    await this.pool.query('UPDATE codigos_recuperacion SET intentos = intentos + 1 WHERE id = ?', [id]);
  }

  async marcarUsado(id: number): Promise<void> {
    await this.pool.query('UPDATE codigos_recuperacion SET usado = 1 WHERE id = ?', [id]);
  }

  async eliminar(id: number): Promise<void> {
    await this.pool.query('DELETE FROM codigos_recuperacion WHERE id = ?', [id]);
  }
}
