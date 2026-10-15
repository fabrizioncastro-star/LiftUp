import { CriterioOrden } from './domain/IFeedRepository';

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
