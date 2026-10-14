import { FeedItem, IFeedRepository } from './domain/IFeedRepository';
import { IFeedStrategy, PrioridadSeguidosStrategy } from './FeedStrategy';

export interface PaginaFeed {
  publicaciones: FeedItem[];
  pagina: number;
  hayMas: boolean;
}

export const LIMITE_MAXIMO = 50;
export const LIMITE_POR_DEFECTO = 20;

export class FeedService {
  constructor(
    private readonly repo: IFeedRepository,
    private readonly estrategia: IFeedStrategy = new PrioridadSeguidosStrategy(),
  ) {}

  async obtener(viewerId: number, paginaPedida?: unknown, limitePedido?: unknown): Promise<PaginaFeed> {
    const pagina = Math.max(1, Math.floor(Number(paginaPedida)) || 1);
    const limite = Math.min(LIMITE_MAXIMO, Math.max(1, Math.floor(Number(limitePedido)) || LIMITE_POR_DEFECTO));

    const filas = await this.repo.listar(viewerId, this.estrategia.criterios(), limite + 1, (pagina - 1) * limite);
    return { publicaciones: filas.slice(0, limite), pagina, hayMas: filas.length > limite };
  }
}
