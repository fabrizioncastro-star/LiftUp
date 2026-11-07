import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Database } from '../../config/Database';
import { IProgresoRepository, LogroObtenido, RecordPersonal, SesionHistorial } from './progreso';

const pool = () => Database.getInstance().getPool();

export class ProgresoRepository implements IProgresoRepository {
  async fechasDeSesiones(usuarioId: number): Promise<Date[]> {
    const [rows] = await pool().query<RowDataPacket[]>('SELECT fecha FROM publicaciones WHERE usuario_id = ?', [usuarioId]);
    return rows.map((r) => new Date(r.fecha));
  }

  async historial(usuarioId: number, limite: number, desplazamiento: number): Promise<SesionHistorial[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT id, fecha, descripcion, ejercicio, peso_kg, series, repeticiones, tipo_archivo, archivo_url
         FROM publicaciones WHERE usuario_id = ? ORDER BY fecha DESC, id DESC LIMIT ? OFFSET ?`,
      [usuarioId, limite, desplazamiento],
    );
    return rows.map((r) => ({
      id: r.id, fecha: new Date(r.fecha).toISOString(), descripcion: r.descripcion, ejercicio: r.ejercicio,
      pesoKg: r.peso_kg === null ? null : Number(r.peso_kg), series: r.series, repeticiones: r.repeticiones,
      tipoArchivo: r.tipo_archivo, archivoUrl: r.archivo_url,
    }));
  }

  async maximoPeso(usuarioId: number, ejercicio: string): Promise<number | null> {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT MAX(peso) AS m FROM records WHERE usuario_id = ? AND LOWER(ejercicio) = LOWER(?)', [usuarioId, ejercicio],
    );
    return rows[0].m === null ? null : Number(rows[0].m);
  }

  async insertarRecord(usuarioId: number, ejercicio: string, peso: number, fecha: string): Promise<RecordPersonal> {
    const [res] = await pool().query<ResultSetHeader>(
      'INSERT INTO records (usuario_id, ejercicio, peso, fecha) VALUES (?, ?, ?, ?)', [usuarioId, ejercicio, peso, fecha],
    );
    return { id: res.insertId, ejercicio, peso, fecha };
  }

  async listarRecords(usuarioId: number): Promise<RecordPersonal[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      `SELECT id, ejercicio, peso, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha FROM records
        WHERE usuario_id = ? ORDER BY fecha DESC, id DESC`, [usuarioId],
    );
    return rows.map((r) => ({ id: r.id, ejercicio: r.ejercicio, peso: Number(r.peso), fecha: r.fecha }));
  }

  async contarRecords(usuarioId: number): Promise<number> {
    const [rows] = await pool().query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM records WHERE usuario_id = ?', [usuarioId]);
    return Number(rows[0].n);
  }

  async listarLogros(usuarioId: number): Promise<LogroObtenido[]> {
    const [rows] = await pool().query<RowDataPacket[]>(
      'SELECT codigo, nombre, fecha_obtenido FROM logros WHERE usuario_id = ? ORDER BY fecha_obtenido DESC, id DESC', [usuarioId],
    );
    return rows.map((r) => ({ codigo: r.codigo, nombre: r.nombre, fechaObtenido: new Date(r.fecha_obtenido).toISOString() }));
  }

  async otorgarLogro(usuarioId: number, codigo: string, nombre: string): Promise<boolean> {
    const [res] = await pool().query<ResultSetHeader>(
      'INSERT IGNORE INTO logros (usuario_id, codigo, nombre) VALUES (?, ?, ?)', [usuarioId, codigo, nombre],
    );
    return res.affectedRows > 0;
  }
}
