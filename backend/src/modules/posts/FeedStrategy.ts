import { CriterioOrden } from './domain/IFeedRepository';

/**
 * Patrón STRATEGY (comportamiento): el criterio de relevancia del feed es intercambiable
 * sin modificar FeedService (OCP). Hoy: seguidos primero (HU-006 esc. 4). Mañana: p. ej.
 * "más reaccionadas", agregando una clase más.
 */
export interface IFeedStrategy {
  readonly nombre: string;
  criterios(): CriterioOrden[];
}

export class PrioridadSeguidosStrategy implements IFeedStrategy {
  readonly nombre = 'prioridad-seguidos';
  criterios(): CriterioOrden[] { return ['seguidos', 'fecha']; }
}

export class SoloFechaStrategy implements IFeedStrategy {
  readonly nombre = 'solo-fecha';
  criterios(): CriterioOrden[] { return ['fecha']; }
}
