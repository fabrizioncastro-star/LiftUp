import { ArchivoSubido, TipoDetectado } from './tipos';

/** Producto A de la familia de medios. Lanza ValidationError si el archivo no es aceptable. */
export interface IValidadorArchivo {
  validar(archivo: ArchivoSubido): TipoDetectado;
}
