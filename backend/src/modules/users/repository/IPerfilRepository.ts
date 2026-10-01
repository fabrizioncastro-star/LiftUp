import { NivelExperiencia, Usuario } from '../domain/Usuario';

export interface CamposPerfil {
  nombre: string;
  nivelExperiencia: NivelExperiencia;
  biografia: string | null;
  fotoPerfil: string | null;
}

/** ISP: interfaz propia de la edición de perfil, separada de IUsuarioRepository (auth). */
export interface IPerfilRepository {
  buscarPorId(id: number): Promise<Usuario | null>;
  actualizarPerfil(id: number, campos: CamposPerfil): Promise<Usuario>;
}
