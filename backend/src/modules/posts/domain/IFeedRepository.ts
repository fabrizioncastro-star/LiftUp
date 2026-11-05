export type CriterioOrden = 'seguidos' | 'fecha';

export interface FeedItem {
  id: number;
  comunidadId: number | null;
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
  totalReacciones: number;
  miReaccion: string | null;
  totalComentarios: number;
}

export interface IFeedRepository {
  listar(viewerId: number, orden: CriterioOrden[], limite: number, desplazamiento: number): Promise<FeedItem[]>;
  listarDeUsuario(viewerId: number, autorId: number, limite: number): Promise<FeedItem[]>;
  listarDeComunidad(viewerId: number, comunidadId: number, limite: number, desplazamiento: number): Promise<FeedItem[]>;
}
