import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Database } from '../../config/Database';
import {
  Comunidad, DatosSolicitud, EstadoSolicitud, IComunidadRepository, ISolicitudRepository, SolicitudComunidad, SolicitudPendiente,
} from './communities';

const pool = () => Database.getInstance().getPool();

export class ComunidadRepository implements IComunidadRepository {
  private static readonly SELECT = `
    SELECT c.id, c.nombre, c.tipo, c.descripcion,
           (SELECT COUNT(*) FROM miembros_comunidad m WHERE m.comunidad_id = c.id) AS miembros,
           EXISTS(SELECT 1 FROM miembros_comunidad m WHERE m.comunidad_id = c.id AND m.usuario_id = ?) AS es_miembro
      FROM comunidades c WHERE c.estado = 'activa'`;

  private aComunidad(r: RowDataPacket): Comunidad {
    return {
      id: r.id, nombre: r.nombre, tipo: r.tipo, descripcion: r.descripcion,
      miembros: Number(r.miembros), esMiembro: Boolean(r.es_miembro),
    };
  }

  async listar(usuarioId: number, texto: string): Promise<Comunidad[]> {
    const patron = `%${texto.replace(/[%_\\]/g, '\\$&')}%`;
    const [rows] = await pool().query<RowDataPacket[]>(
      `${ComunidadRepository.SELECT} AND (c.nombre LIKE ? OR c.tipo LIKE ? OR c.descripcion LIKE ?) ORDER BY c.nombre`,
      [usuarioId, patron, patron, patron],
    );
    return rows.map((r) => this.aComunidad(r));
  }

  async mias(usuarioId: number): Promise<Comunidad[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      `${ComunidadRepository.SELECT} AND EXISTS(SELECT 1 FROM miembros_comunidad m WHERE m.comunidad_id = c.id AND m.usuario_id = ?) ORDER BY c.nombre`,
      [usuarioId, usuarioId],
    );
    return rows.map((r) => this.aComunidad(r));
  }

  async buscarPorId(id: number) {
    const [rows] = await pool().query<RowDataPacket[]>('SELECT id, nombre, estado FROM comunidades WHERE id = ?', [id]);
    return rows[0] ? { id: rows[0].id, nombre: rows[0].nombre, estado: rows[0].estado } : null;
  }

  async crear(datos: DatosSolicitud): Promise<number> {
    const [res] = await pool().query<ResultSetHeader>(
      'INSERT INTO comunidades (nombre, tipo, descripcion) VALUES (?, ?, ?)', [datos.nombre, datos.tipo, datos.descripcion],
    );
    return res.insertId;
  }

  async unir(comunidadId: number, usuarioId: number): Promise<void> {
    await pool().query('INSERT IGNORE INTO miembros_comunidad (comunidad_id, usuario_id) VALUES (?, ?)', [comunidadId, usuarioId]);
  }

  async esMiembro(comunidadId: number, usuarioId: number): Promise<boolean> {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT 1 AS x FROM miembros_comunidad WHERE comunidad_id = ? AND usuario_id = ? LIMIT 1', [comunidadId, usuarioId],
    );
    return rows.length > 0;
  }
}

export class SolicitudRepository implements ISolicitudRepository {
  private aSolicitud(r: RowDataPacket): SolicitudComunidad {
    return new SolicitudComunidad(
      r.id, r.usuario_id, { nombre: r.nombre, tipo: r.tipo, descripcion: r.descripcion },
      r.estado as EstadoSolicitud, new Date(r.fecha).toISOString(),
    );
  }

  async crear(usuarioId: number, datos: DatosSolicitud): Promise<SolicitudComunidad> {
    const [res] = await pool().query<ResultSetHeader>(
      'INSERT INTO solicitudes_comunidad (usuario_id, nombre, tipo, descripcion) VALUES (?, ?, ?, ?)',
      [usuarioId, datos.nombre, datos.tipo, datos.descripcion],
    );
    return (await this.buscarPorId(res.insertId)) as SolicitudComunidad;
  }

  async buscarPorId(id: number): Promise<SolicitudComunidad | null> {
    const [rows] = await pool().query<RowDataPacket[]>('SELECT * FROM solicitudes_comunidad WHERE id = ?', [id]);
    return rows[0] ? this.aSolicitud(rows[0]) : null;
  }

  async guardarEstado(s: SolicitudComunidad): Promise<void> {
    await pool().query('UPDATE solicitudes_comunidad SET estado = ? WHERE id = ?', [s.estado, s.id]);
  }

  async existeNombre(nombre: string): Promise<boolean> {
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT 1 AS x FROM solicitudes_comunidad WHERE LOWER(nombre) = LOWER(?) AND estado IN ('pendiente','aprobada')
       UNION SELECT 1 FROM comunidades WHERE LOWER(nombre) = LOWER(?) LIMIT 1`,
      [nombre, nombre],
    );
    return rows.length > 0;
  }

  async pendientes(): Promise<SolicitudPendiente[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT s.id, s.nombre, s.tipo, s.descripcion, s.fecha, u.id AS uid, u.nombre AS unombre
         FROM solicitudes_comunidad s JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.estado = 'pendiente' ORDER BY s.fecha ASC`,
    );
    return rows.map((r) => ({
      id: r.id, nombre: r.nombre, tipo: r.tipo, descripcion: r.descripcion, fecha: new Date(r.fecha).toISOString(),
      solicitante: { id: r.uid, nombre: r.unombre },
    }));
  }

  async delUsuario(usuarioId: number): Promise<SolicitudComunidad[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT * FROM solicitudes_comunidad WHERE usuario_id = ? ORDER BY fecha DESC', [usuarioId],
    );
    return rows.map((r) => this.aSolicitud(r));
  }
}
