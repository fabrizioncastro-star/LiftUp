import { Usuario } from '../domain/Usuario';

export interface IUsuarioRepository {
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  crear(usuario: Usuario): Promise<Usuario>;
}
