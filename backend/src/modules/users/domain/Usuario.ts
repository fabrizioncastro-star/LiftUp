export type Rol = 'usuario' | 'admin';
export type EstadoCuenta = 'activo' | 'suspendido' | 'inactivo';
export type NivelExperiencia = 'sin_experiencia' | 'principiante' | 'intermedio' | 'avanzado';
export type Privacidad = 'publica' | 'solo_amigos' | 'privada';

export interface UsuarioProps {
  id?: number;
  nombre: string;
  correo: string;
  contrasenaHash: string;
  rol?: Rol;
  fotoPerfil?: string | null;
  nivelExperiencia?: NivelExperiencia;
  biografia?: string | null;
  privacidad?: Privacidad;
  estado?: EstadoCuenta;
  fechaRegistro?: Date;
}

/**
 * Clase de dominio Usuario (POO: atributos privados + encapsulamiento).
 * Coherente con el diagrama de clases del proyecto. Administrador heredará de esta
 * clase (LSP) en el Release 2.
 */
export class Usuario {
  private readonly _id?: number;
  private readonly _nombre: string;
  private readonly _correo: string;
  private readonly _contrasenaHash: string;
  private readonly _rol: Rol;
  private readonly _fotoPerfil: string | null;
  private readonly _nivelExperiencia: NivelExperiencia;
  private readonly _biografia: string | null;
  private readonly _privacidad: Privacidad;
  private readonly _estado: EstadoCuenta;
  private readonly _fechaRegistro?: Date;

  constructor(p: UsuarioProps) {
    this._id = p.id;
    this._nombre = p.nombre;
    this._correo = p.correo;
    this._contrasenaHash = p.contrasenaHash;
    this._rol = p.rol ?? 'usuario';
    this._fotoPerfil = p.fotoPerfil ?? null;
    this._nivelExperiencia = p.nivelExperiencia ?? 'sin_experiencia';
    this._biografia = p.biografia ?? null;
    this._privacidad = p.privacidad ?? 'publica';
    this._estado = p.estado ?? 'activo';
    this._fechaRegistro = p.fechaRegistro;
  }

  get id(): number | undefined { return this._id; }
  get nombre(): string { return this._nombre; }
  get correo(): string { return this._correo; }
  get contrasenaHash(): string { return this._contrasenaHash; }
  get rol(): Rol { return this._rol; }
  get estado(): EstadoCuenta { return this._estado; }
  get fotoPerfil(): string | null { return this._fotoPerfil; }
  get nivelExperiencia(): NivelExperiencia { return this._nivelExperiencia; }
  get biografia(): string | null { return this._biografia; }
  get privacidad(): Privacidad { return this._privacidad; }
  get fechaRegistro(): Date | undefined { return this._fechaRegistro; }

  /** Representación segura: nunca expone el hash de la contraseña. */
  toPublico() {
    return {
      id: this._id,
      nombre: this._nombre,
      correo: this._correo,
      rol: this._rol,
      fotoPerfil: this._fotoPerfil,
      nivelExperiencia: this._nivelExperiencia,
      biografia: this._biografia,
      privacidad: this._privacidad,
      estado: this._estado,
      fechaRegistro: this._fechaRegistro,
    };
  }
}
