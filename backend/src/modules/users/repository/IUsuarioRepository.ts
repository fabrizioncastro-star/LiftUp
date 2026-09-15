import { Usuario } from '../domain/Usuario';

/**
 * ISP: interfaz pequeña, solo lo que necesita el módulo de autenticación.
 * DIP: AuthService depende de esta abstracción, no de MySQL.
 */
export interface IUsuarioRepository {
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  crear(usuario: Usuario): Promise<Usuario>;
}
