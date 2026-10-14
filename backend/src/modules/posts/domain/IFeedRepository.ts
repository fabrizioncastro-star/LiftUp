/** Criterios de orden que el repositorio sabe traducir a SQL (lista cerrada, no entrada del usuario). */
export type CriterioOrden = 'seguidos' | 'fecha';

export interface FeedItem {
  id: number;
  descripcion: string | null;
  archivoUrl: string;
  tipoArchivo: 'imagen' | 'video';
  ejercicio: string | null;
  pesoKg: number | null;
  series: number | null;
  repeticiones: number | null;
  fecha: string;
  autor: { id: number; nombre: string; fotoPerfil: string | null };
  esMia: boolean;
  deSeguido: boolean;
}

export interface IFeedRepository {
  listar(viewerId: number, orden: CriterioOrden[], limite: number, desplazamiento: number): Promise<FeedItem[]>;
}
