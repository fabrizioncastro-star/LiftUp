import { RowDataPacket } from 'mysql2/promise';
import { Database } from '../../../config/Database';
import { CriterioOrden, FeedItem, IFeedRepository } from '../domain/IFeedRepository';

const SQL_ORDEN: Record<CriterioOrden, string> = {
  seguidos: 's.id IS NOT NULL DESC',
  fecha: 'p.fecha DESC, p.id DESC',
};

const SELECT_BASE = `
  SELECT p.id, p.comunidad_id, p.descripcion, p.archivo_url, p.tipo_archivo, p.ejercicio, p.peso_kg,
         p.series, p.repeticiones, p.fecha, u.id AS autor_id, u.nombre AS autor_nombre,
         u.foto_perfil AS autor_foto, (s.id IS NOT NULL) AS de_seguido,
         (SELECT COUNT(*) FROM reacciones r WHERE r.publicacion_id = p.id) AS total_reacciones,
         (SELECT r.tipo FROM reacciones r WHERE r.publicacion_id = p.id AND r.usuario_id = ?) AS mi_reaccion,
         (SELECT COUNT(*) FROM comentarios c WHERE c.publicacion_id = p.id) AS total_comentarios
    FROM publicaciones p
    JOIN usuarios u ON u.id = p.usuario_id AND u.estado = 'activo'
    LEFT JOIN seguimientos s
           ON s.seguidor_id = ? AND s.seguido_id = p.usuario_id AND s.estado = 'aceptado'
    LEFT JOIN seguimientos s2
           ON s2.seguidor_id = p.usuario_id AND s2.seguido_id = ? AND s2.estado = 'aceptado'`;

const VISIBLE_PARA_VIEWER = `(p.usuario_id = ? OR u.privacidad = 'publica'
   OR (u.privacidad = 'privada' AND s.id IS NOT NULL)
   OR (u.privacidad = 'solo_amigos' AND s.id IS NOT NULL AND s2.id IS NOT NULL))`;

export class FeedRepository implements IFeedRepository {
  private get pool() { return Database.getInstance().getPool(); }

  listar(viewerId: number, orden: CriterioOrden[], limite: number, desplazamiento: number): Promise<FeedItem[]> {
    const orderBy = orden.map((c) => SQL_ORDEN[c]).join(', ');
    return this.consultar(
      `${SELECT_BASE} WHERE p.comunidad_id IS NULL AND ${VISIBLE_PARA_VIEWER}
        ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [viewerId, viewerId, viewerId, viewerId, limite, desplazamiento], viewerId,
    );
  }

  listarDeUsuario(viewerId: number, autorId: number, limite: number): Promise<FeedItem[]> {
    return this.consultar(
      `${SELECT_BASE} WHERE p.usuario_id = ? AND p.comunidad_id IS NULL
        ORDER BY p.fecha DESC, p.id DESC LIMIT ?`,
      [viewerId, viewerId, viewerId, autorId, limite], viewerId,
    );
  }

  listarDeComunidad(viewerId: number, comunidadId: number, limite: number, desplazamiento: number): Promise<FeedItem[]> {
    return this.consultar(
      `${SELECT_BASE} WHERE p.comunidad_id = ?
        ORDER BY p.fecha DESC, p.id DESC LIMIT ? OFFSET ?`,
      [viewerId, viewerId, viewerId, comunidadId, limite, desplazamiento], viewerId,
    );
  }

  private async consultar(sql: string, params: unknown[], viewerId: number): Promise<FeedItem[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(sql, params);
    return rows.map((r) => ({
      id: r.id,
      comunidadId: r.comunidad_id,
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
      totalReacciones: Number(r.total_reacciones),
      miReaccion: r.mi_reaccion ?? null,
      totalComentarios: Number(r.total_comentarios),
    }));
  }
}
