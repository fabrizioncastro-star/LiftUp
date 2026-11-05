import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Database } from '../../config/Database';
import {
  EstadoSeguimiento, ISeguimientoRepository, IUsuarioSocialRepository, SeguimientoFila, SolicitudSeguimiento, UsuarioBasico,
} from './social';
import { Privacidad } from './reglasVisibilidad';

const pool = () => Database.getInstance().getPool();

export class SeguimientoRepository implements ISeguimientoRepository {
  private aFila(r: RowDataPacket): SeguimientoFila {
    return { id: r.id, seguidorId: r.seguidor_id, seguidoId: r.seguido_id, estado: r.estado as EstadoSeguimiento };
  }

  async obtener(seguidorId: number, seguidoId: number) {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT * FROM seguimientos WHERE seguidor_id = ? AND seguido_id = ?', [seguidorId, seguidoId],
    );
    return rows[0] ? this.aFila(rows[0]) : null;
  }

  async buscarPorId(id: number) {
    const [rows] = await pool().query<RowDataPacket[]>('SELECT * FROM seguimientos WHERE id = ?', [id]);
    return rows[0] ? this.aFila(rows[0]) : null;
  }

  async crear(seguidorId: number, seguidoId: number, estado: EstadoSeguimiento): Promise<void> {
    await pool().query(
      'INSERT IGNORE INTO seguimientos (seguidor_id, seguido_id, estado) VALUES (?, ?, ?)', [seguidorId, seguidoId, estado],
    );
  }

  async eliminar(seguidorId: number, seguidoId: number): Promise<boolean> {
    const [res] = await pool().query<ResultSetHeader>(
      'DELETE FROM seguimientos WHERE seguidor_id = ? AND seguido_id = ?', [seguidorId, seguidoId],
    );
    return res.affectedRows > 0;
  }

  async eliminarPorId(id: number): Promise<void> {
    await pool().query('DELETE FROM seguimientos WHERE id = ?', [id]);
  }

  async aceptar(id: number): Promise<void> {
    await pool().query("UPDATE seguimientos SET estado = 'aceptado' WHERE id = ?", [id]);
  }

  async aceptarPendientesDe(seguidoId: number): Promise<void> {
    await pool().query("UPDATE seguimientos SET estado = 'aceptado' WHERE seguido_id = ? AND estado = 'pendiente'", [seguidoId]);
  }

  async pendientesDe(seguidoId: number): Promise<SolicitudSeguimiento[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT s.id, s.fecha, u.id AS uid, u.nombre, u.foto_perfil
         FROM seguimientos s JOIN usuarios u ON u.id = s.seguidor_id
        WHERE s.seguido_id = ? AND s.estado = 'pendiente' ORDER BY s.fecha DESC`, [seguidoId],
    );
    return rows.map((r) => ({
      id: r.id, fecha: new Date(r.fecha).toISOString(), seguidor: { id: r.uid, nombre: r.nombre, fotoPerfil: r.foto_perfil },
    }));
  }

  async contar(usuarioId: number) {
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM seguimientos WHERE seguido_id = ? AND estado = 'aceptado') AS seguidores,
         (SELECT COUNT(*) FROM seguimientos WHERE seguidor_id = ? AND estado = 'aceptado') AS seguidos`,
      [usuarioId, usuarioId],
    );
    return { seguidores: Number(rows[0].seguidores), seguidos: Number(rows[0].seguidos) };
  }
}

export class UsuarioSocialRepository implements IUsuarioSocialRepository {
  private aBasico(r: RowDataPacket): UsuarioBasico {
    return {
      id: r.id, nombre: r.nombre, fotoPerfil: r.foto_perfil, nivelExperiencia: r.nivel_experiencia,
      biografia: r.biografia, privacidad: r.privacidad as Privacidad, estado: r.estado,
    };
  }

  async buscarBasico(id: number) {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT id, nombre, foto_perfil, nivel_experiencia, biografia, privacidad, estado FROM usuarios WHERE id = ?', [id],
    );
    return rows[0] ? this.aBasico(rows[0]) : null;
  }

  async buscarPorNombre(texto: string, excluirId: number, limite: number) {
    const patron = `%${texto.replace(/[%_\\]/g, '\\$&')}%`;
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT id, nombre, foto_perfil, nivel_experiencia, biografia, privacidad, estado FROM usuarios
        WHERE nombre LIKE ? AND id <> ? AND estado = 'activo' ORDER BY nombre LIMIT ?`, [patron, excluirId, limite],
    );
    return rows.map((r) => this.aBasico(r));
  }

  async actualizarPrivacidad(id: number, privacidad: Privacidad): Promise<void> {
    await pool().query('UPDATE usuarios SET privacidad = ? WHERE id = ?', [privacidad, id]);
  }
}
