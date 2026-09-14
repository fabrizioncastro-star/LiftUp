import axios from 'axios';

export const TOKEN_KEY = 'liftup_token';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://indigo-pigeon-660133.hostingersite.com';

// Cliente HTTP único de la app (capa de presentación -> API REST).
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // HU-001: registro en < 10 s
});

let alSesionExpirada: (() => void) | null = null;

/** AuthProvider registra aquí qué hacer cuando el servidor dice que la sesión ya no vale. */
export function registrarAlSesionExpirada(fn: (() => void) | null): void {
  alSesionExpirada = fn;
}

// Si una petición con sesión recibe 401 (token vencido, sesión cerrada o cuenta suspendida),
// la app vuelve sola al inicio de sesión en lugar de quedarse mostrando errores.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401 && err.config?.headers?.Authorization) {
      alSesionExpirada?.();
    }
    return Promise.reject(err);
  },
);

/** Convierte una ruta guardada en BD ("/uploads/...") en URL completa para mostrar. */
export function urlMedia(ruta: string | null | undefined): string | null {
  return ruta ? `${BASE_URL}${ruta}` : null;
}

/** Extrae el mensaje del backend ({ error }) o uno genérico si no hay red. */
export function mensajeDeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  return 'Ocurrió un error inesperado.';
}

/** Fecha legible en español (Perú). */
export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}
