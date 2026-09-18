import { Sesion } from './Sesion';

export interface ISesionRepository {
  crear(sesion: Sesion): Promise<void>;
  existeVigente(token: string): Promise<boolean>;
  eliminar(token: string): Promise<void>;
}
