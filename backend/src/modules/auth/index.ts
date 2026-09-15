// Interfaz pública del módulo (encapsulamiento entre paquetes): otros módulos importan de aquí.
export { crearAuthModulo } from './auth.routes';
export type { AuthModulo } from './auth.routes';
export { AuthService } from './AuthService';
