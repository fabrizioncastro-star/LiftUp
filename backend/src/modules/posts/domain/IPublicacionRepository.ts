import { Publicacion } from './Publicacion';

export interface IPublicacionRepository {
  crear(p: Publicacion): Promise<Publicacion>;
  buscarPorId(id: number): Promise<Publicacion | null>;
  actualizar(p: Publicacion): Promise<void>;
  eliminar(id: number): Promise<void>;
}
