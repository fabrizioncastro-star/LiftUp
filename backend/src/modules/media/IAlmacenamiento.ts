import { ArchivoSubido } from './tipos';

/** Producto B de la familia de medios. Hoy disco local; mañana un CDN (patrón Adapter). */
export interface IAlmacenamiento {
  /** Guarda el archivo y devuelve la ruta pública (lo único que se guarda en BD). */
  guardar(archivo: ArchivoSubido): Promise<string>;
  eliminar(url: string): Promise<void>;
}
