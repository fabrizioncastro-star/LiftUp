import axios from 'axios';

export const TOKEN_KEY = 'liftup_token';
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://indigo-pigeon-660133.hostingersite.com';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let alSesionExpirada: (() => void) | null = null;

export function registrarAlSesionExpirada(fn: (() => void) | null): void {
  alSesionExpirada = fn;
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401 && err.config?.headers?.Authorization) {
      alSesionExpirada?.();
    }
    return Promise.reject(err);
  },
);

export function urlMedia(ruta: string | null | undefined): string | null {
  return ruta ? `${BASE_URL}${ruta}` : null;
}

export function mensajeDeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  return 'Ocurrió un error inesperado.';
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}
