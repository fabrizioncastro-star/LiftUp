import { RowDataPacket } from 'mysql2/promise';
import { Database } from '../../../config/Database';
import { CriterioOrden, FeedItem, IFeedRepository } from '../domain/IFeedRepository';

// Traducción de criterios (lista cerrada) a SQL: nada de lo que envía el usuario llega al ORDER BY.
const SQL_ORDEN: Record<CriterioOrden, string> = {
  seguidos: 's.id IS NOT NULL DESC',
  fecha: 'p.fecha DESC, p.id DESC',
};

/** DAO de lectura del feed (join publicaciones + autor + relación de seguimiento del espectador). */
export class FeedRepository implements IFeedRepository {
  async listar(viewerId: number, orden: CriterioOrden[], limite: number, desplazamiento: number): Promise<FeedItem[]> {
    const orderBy = orden.map((c) => SQL_ORDEN[c]).join(', ');
    const [rows] = await Database.getInstance().getPool().query<RowDataPacket[]>(
      `SELECT p.id, p.descripcion, p.archivo_url, p.tipo_archivo, p.ejercicio, p.peso_kg, p.series,
              p.repeticiones, p.fecha, u.id AS autor_id, u.nombre AS autor_nombre,
              u.foto_perfil AS autor_foto, (s.id IS NOT NULL) AS de_seguido
         FROM publicaciones p
         JOIN usuarios u ON u.id = p.usuario_id AND u.estado = 'activo'
         LEFT JOIN seguimientos s
                ON s.seguidor_id = ? AND s.seguido_id = p.usuario_id AND s.estado = 'aceptado'
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?`,
      [viewerId, limite, desplazamiento],
    );
    return rows.map((r) => ({
      id: r.id,
      descripcion: r.descripcion,
      archivoUrl: r.archivo_url,
      tipoArchivo: r.tipo_archivo,
      ejercicio: r.ejercicio,
      pesoKg: r.peso_kg === null ? null : Number(r.peso_kg),
      series: r.series,
      repeticiones: r.repeticiones,
      fecha: new Date(r.fecha).toISOString(),
      autor: { id: r.autor_id, nombre: r.autor_nombre, fotoPerfil: r.autor_foto },
      esMia: r.autor_id === viewerId,
      deSeguido: Boolean(r.de_seguido),
    }));
  }
}
