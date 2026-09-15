import { Sesion } from './Sesion';

export interface ISesionRepository {
  crear(sesion: Sesion): Promise<void>;
  /** true si el token existe en `sesiones` y no ha expirado (permite revocar JWT). */
  existeVigente(token: string): Promise<boolean>;
  /** Invalida la sesión (HU-003): el JWT deja de ser aceptado aunque no haya expirado. */
  eliminar(token: string): Promise<void>;
}
