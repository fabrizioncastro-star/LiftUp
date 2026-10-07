import { ArchivoSubido, TipoDetectado } from './tipos';

export interface IValidadorArchivo {
  validar(archivo: ArchivoSubido): TipoDetectado;
}
