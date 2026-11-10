import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Database } from '../../config/Database';
import { Comentario, IComentarioRepository, IReaccionRepository, ResumenReacciones, TipoReaccion } from './interactions';

const pool = () => Database.getInstance().getPool();

export class ReaccionRepository implements IReaccionRepository {
  async obtener(publicacionId: number, usuarioId: number): Promise<TipoReaccion | null> {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT tipo FROM reacciones WHERE publicacion_id = ? AND usuario_id = ?', [publicacionId, usuarioId],
    );
    return rows[0] ? (rows[0].tipo as TipoReaccion) : null;
  }

  async guardar(publicacionId: number, usuarioId: number, tipo: TipoReaccion): Promise<void> {
    await pool().query(
      `INSERT INTO reacciones (publicacion_id, usuario_id, tipo) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE tipo = VALUES(tipo)`,
      [publicacionId, usuarioId, tipo],
    );
  }

  async quitar(publicacionId: number, usuarioId: number): Promise<void> {
    await pool().query('DELETE FROM reacciones WHERE publicacion_id = ? AND usuario_id = ?', [publicacionId, usuarioId]);
  }

  async resumen(publicacionId: number, usuarioId: number): Promise<ResumenReacciones> {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT tipo, COUNT(*) AS n FROM reacciones WHERE publicacion_id = ? GROUP BY tipo', [publicacionId],
    );
    const porTipo: Record<string, number> = {};
    let total = 0;
    for (const r of rows) { porTipo[r.tipo] = Number(r.n); total += Number(r.n); }
    return { total, porTipo, miReaccion: await this.obtener(publicacionId, usuarioId) };
  }
}

export class ComentarioRepository implements IComentarioRepository {
  private static readonly SELECT = `
    SELECT c.id, c.publicacion_id, c.texto, c.fecha, u.id AS autor_id, u.nombre AS autor_nombre, u.foto_perfil AS autor_foto
      FROM comentarios c JOIN usuarios u ON u.id = c.usuario_id`;

  async crear(publicacionId: number, usuarioId: number, texto: string): Promise<Comentario> {
    const [res] = await pool().query<ResultSetHeader>(
      'INSERT INTO comentarios (publicacion_id, usuario_id, texto) VALUES (?, ?, ?)', [publicacionId, usuarioId, texto],
    );
    const [rows] = await pool().query<RowDataPacket[]>(`${ComentarioRepository.SELECT} WHERE c.id = ?`, [res.insertId]);
    return this.aComentario(rows[0]);
  }

  async listar(publicacionId: number): Promise<Comentario[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      `${ComentarioRepository.SELECT} WHERE c.publicacion_id = ? ORDER BY c.fecha ASC, c.id ASC`, [publicacionId],
    );
    return rows.map((r) => this.aComentario(r));
  }

  async buscarPorId(id: number) {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT id, usuario_id, publicacion_id FROM comentarios WHERE id = ?', [id],
    );
    return rows[0] ? { id: rows[0].id, usuarioId: rows[0].usuario_id, publicacionId: rows[0].publicacion_id } : null;
  }

  async eliminar(id: number): Promise<void> {
    await pool().query('DELETE FROM comentarios WHERE id = ?', [id]);
  }

  private aComentario(r: RowDataPacket): Comentario {
    return {
      id: r.id, publicacionId: r.publicacion_id, texto: r.texto, fecha: new Date(r.fecha).toISOString(),
      autor: { id: r.autor_id, nombre: r.autor_nombre, fotoPerfil: r.autor_foto },
    };
  }
}
