import { EstadoCuenta, Usuario } from '../domain/Usuario';

export interface IUsuarioRepository {
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorId(id: number): Promise<Usuario | null>;
  crear(usuario: Usuario): Promise<Usuario>;
  actualizarContrasena(id: number, contrasenaHash: string): Promise<void>;
}

export interface IEstadoCuentaRepository {
  buscarPorId(id: number): Promise<Usuario | null>;
  actualizarEstado(id: number, estado: EstadoCuenta): Promise<void>;
}
