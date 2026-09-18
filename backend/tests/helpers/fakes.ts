import { AuthService } from '../../src/modules/auth/AuthService';
import { IPasswordHasher } from '../../src/modules/auth/domain/IPasswordHasher';
import { ISesionRepository } from '../../src/modules/auth/domain/ISesionRepository';
import { ITokenService, TokenPayload } from '../../src/modules/auth/domain/ITokenService';
import { Sesion } from '../../src/modules/auth/domain/Sesion';
import { EstadoCuenta, Usuario } from '../../src/modules/users/domain/Usuario';
import { IUsuarioRepository } from '../../src/modules/users/repository/IUsuarioRepository';

// Dobles de prueba en memoria: posibles gracias a DIP (el service depende de interfaces).
export class UsuarioRepoFalso implements IUsuarioRepository {
  guardados: Usuario[] = [];
  async buscarPorCorreo(correo: string) { return this.guardados.find((u) => u.correo === correo) ?? null; }
  async buscarPorId(id: number) { return this.guardados.find((u) => u.id === id) ?? null; }
  async crear(u: Usuario) {
    const conId = new Usuario({ id: this.guardados.length + 1, nombre: u.nombre, correo: u.correo, contrasenaHash: u.contrasenaHash });
    this.guardados.push(conId);
    return conId;
  }
  sembrar(correo: string, clave: string, estado: EstadoCuenta = 'activo') {
    this.guardados.push(new Usuario({
      id: this.guardados.length + 1, nombre: 'Ana', correo, contrasenaHash: `hash(${clave})`, estado,
    }));
  }
}

export class SesionRepoFalso implements ISesionRepository {
  sesiones: Sesion[] = [];
  async crear(s: Sesion) { this.sesiones.push(s); }
  async existeVigente(token: string) { return this.sesiones.some((s) => s.token === token); }
  async eliminar(token: string) { this.sesiones = this.sesiones.filter((s) => s.token !== token); }
}

export const hasherFalso: IPasswordHasher = {
  hash: async (p) => `hash(${p})`,
  comparar: async (p, h) => h === `hash(${p})`,
};

export const tokensFalso: ITokenService = {
  firmar: (p) => `token-${p.id}`,
  verificar: (t): TokenPayload => {
    if (!t.startsWith('token-')) throw new Error('inválido');
    return { id: Number(t.slice(6)), correo: 'x@x.com', rol: 'usuario' };
  },
  calcularExpiracion: () => new Date('2030-01-01'),
};

export function crearServicio() {
  const usuarios = new UsuarioRepoFalso();
  const sesiones = new SesionRepoFalso();
  return { usuarios, sesiones, service: new AuthService(usuarios, sesiones, hasherFalso, tokensFalso) };
}
