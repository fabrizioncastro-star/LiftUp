import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Database } from '../../config/Database';
import { IHistorialRepository } from './comandos';
import { EstadoReporte, IReporteRepository, MotivoReporte, ReportePendiente, TipoObjetivo } from './reportes';

const pool = () => Database.getInstance().getPool();

export class ReporteRepository implements IReporteRepository {
  async existe(reportanteId: number, tipo: TipoObjetivo, objetivoId: number): Promise<boolean> {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT 1 AS x FROM reportes WHERE reportante_id = ? AND objetivo_tipo = ? AND objetivo_id = ? LIMIT 1',
      [reportanteId, tipo, objetivoId],
    );
    return rows.length > 0;
  }

  async crear(reportanteId: number, tipo: TipoObjetivo, objetivoId: number, motivo: MotivoReporte, detalle: string | null): Promise<void> {
    await pool().query(
      'INSERT IGNORE INTO reportes (reportante_id, objetivo_tipo, objetivo_id, motivo, detalle) VALUES (?, ?, ?, ?, ?)',
      [reportanteId, tipo, objetivoId, motivo, detalle],
    );
  }

  async pendientes(): Promise<ReportePendiente[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT r.id, r.objetivo_tipo, r.objetivo_id, r.motivo, r.detalle, r.fecha,
              ur.id AS rid, ur.nombre AS rnombre,
              p.id AS p_id, p.descripcion AS p_desc, p.archivo_url, p.tipo_archivo, pa.id AS pa_id, pa.nombre AS pa_nombre,
              uu.id AS u_id, uu.nombre AS u_nombre, uu.estado AS u_estado
         FROM reportes r
         JOIN usuarios ur ON ur.id = r.reportante_id
         LEFT JOIN publicaciones p ON r.objetivo_tipo = 'publicacion' AND p.id = r.objetivo_id
         LEFT JOIN usuarios pa ON pa.id = p.usuario_id
         LEFT JOIN usuarios uu ON r.objetivo_tipo = 'usuario' AND uu.id = r.objetivo_id
        WHERE r.estado = 'pendiente' ORDER BY r.fecha ASC, r.id ASC`,
    );
    return rows.map((r) => ({
      id: r.id, tipo: r.objetivo_tipo, objetivoId: r.objetivo_id, motivo: r.motivo, detalle: r.detalle,
      fecha: new Date(r.fecha).toISOString(), reportante: { id: r.rid, nombre: r.rnombre },
      publicacion: r.p_id
        ? { id: r.p_id, descripcion: r.p_desc, archivoUrl: r.archivo_url, tipoArchivo: r.tipo_archivo, autor: { id: r.pa_id, nombre: r.pa_nombre } }
        : null,
      usuario: r.u_id ? { id: r.u_id, nombre: r.u_nombre, estado: r.u_estado } : null,
    }));
  }

  async marcar(id: number, estado: EstadoReporte): Promise<boolean> {
    const [res] = await pool().query<ResultSetHeader>("UPDATE reportes SET estado = ? WHERE id = ? AND estado = 'pendiente'", [estado, id]);
    return res.affectedRows > 0;
  }

  async marcarPorObjetivo(tipo: TipoObjetivo, objetivoId: number, estado: EstadoReporte): Promise<void> {
    await pool().query(
      "UPDATE reportes SET estado = ? WHERE objetivo_tipo = ? AND objetivo_id = ? AND estado = 'pendiente'", [estado, tipo, objetivoId],
    );
  }
}

export class HistorialRepository implements IHistorialRepository {
  async registrar(adminId: number, accion: string, objetivoTipo: string, objetivoId: number, detalle: string): Promise<void> {
    await pool().query(
      'INSERT INTO historial_moderacion (admin_id, accion, objetivo_tipo, objetivo_id, detalle) VALUES (?, ?, ?, ?, ?)',
      [adminId, accion, objetivoTipo, objetivoId, detalle],
    );
  }

  async listar(limite: number) {
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT h.id, u.nombre AS admin, h.accion, h.objetivo_tipo, h.objetivo_id, h.detalle, h.fecha
         FROM historial_moderacion h JOIN usuarios u ON u.id = h.admin_id ORDER BY h.fecha DESC, h.id DESC LIMIT ?`, [limite],
    );
    return rows.map((r) => ({
      id: r.id, admin: r.admin, accion: r.accion, objetivoTipo: r.objetivo_tipo, objetivoId: r.objetivo_id,
      detalle: r.detalle, fecha: new Date(r.fecha).toISOString(),
    }));
  }
}
