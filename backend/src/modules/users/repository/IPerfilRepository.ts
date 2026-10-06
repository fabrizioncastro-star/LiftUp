import { NivelExperiencia, Usuario } from '../domain/Usuario';

export interface CamposPerfil {
  nombre: string;
  nivelExperiencia: NivelExperiencia;
  biografia: string | null;
  fotoPerfil: string | null;
}

export interface IPerfilRepository {
  buscarPorId(id: number): Promise<Usuario | null>;
  actualizarPerfil(id: number, campos: CamposPerfil): Promise<Usuario>;
}
