import { ArchivoSubido } from './tipos';

export interface IAlmacenamiento {
  guardar(archivo: ArchivoSubido): Promise<string>;
  eliminar(url: string): Promise<void>;
}
