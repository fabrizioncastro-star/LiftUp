import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Database } from '../../../config/Database';
import { IPublicacionRepository } from '../domain/IPublicacionRepository';
import { Publicacion } from '../domain/Publicacion';
import { fabricaPorTipoGuardado } from '../domain/PublicacionFactory';

/** DAO de la tabla `publicaciones`. */
export class PublicacionRepository implements IPublicacionRepository {
  private get pool() { return Database.getInstance().getPool(); }

  async crear(p: Publicacion): Promise<Publicacion> {
    const e = p.entrenamiento;
    const [res] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO publicaciones
        (usuario_id, descripcion, archivo_url, tipo_archivo, ejercicio, peso_kg, series, repeticiones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.usuarioId, p.descripcion, p.archivoUrl, p.tipoArchivo, e.ejercicio, e.pesoKg, e.series, e.repeticiones],
    );
    return (await this.buscarPorId(res.insertId)) as Publicacion;
  }

  async buscarPorId(id: number): Promise<Publicacion | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM publicaciones WHERE id = ?', [id]);
    return rows[0] ? this.aDominio(rows[0]) : null;
  }

  async actualizar(p: Publicacion): Promise<void> {
    const e = p.entrenamiento;
    await this.pool.query(
      'UPDATE publicaciones SET descripcion = ?, ejercicio = ?, peso_kg = ?, series = ?, repeticiones = ? WHERE id = ?',
      [p.descripcion, e.ejercicio, e.pesoKg, e.series, e.repeticiones, p.id],
    );
  }

  async eliminar(id: number): Promise<void> {
    await this.pool.query('DELETE FROM publicaciones WHERE id = ?', [id]);
  }

  private aDominio(r: RowDataPacket): Publicacion {
    return fabricaPorTipoGuardado(r.tipo_archivo).crear({
      id: r.id, usuarioId: r.usuario_id, descripcion: r.descripcion, archivoUrl: r.archivo_url,
      ejercicio: r.ejercicio, pesoKg: r.peso_kg === null ? null : Number(r.peso_kg),
      series: r.series, repeticiones: r.repeticiones, fecha: r.fecha,
    });
  }
}
