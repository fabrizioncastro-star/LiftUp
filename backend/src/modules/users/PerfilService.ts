import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { MediaFactory } from '../media/MediaFactory';
import { ArchivoSubido } from '../media/tipos';
import { NivelExperiencia, Usuario } from './domain/Usuario';
import { IPerfilRepository } from './repository/IPerfilRepository';

export interface DatosPerfil {
  nombre?: unknown;
  nivelExperiencia?: unknown;
  biografia?: unknown;
}

export const NIVELES: NivelExperiencia[] = ['sin_experiencia', 'principiante', 'intermedio', 'avanzado'];
export const MAX_BIOGRAFIA = 500;

/**
 * HU-004 editarPerfil(). Valida TODO antes de escribir (si algo falla no se guarda nada).
 * Los objetos de medios (validador y almacenamiento) vienen de una MediaFactory inyectada:
 * Abstract Factory + DIP.
 */
export class PerfilService {
  constructor(private readonly perfiles: IPerfilRepository, private readonly medios: MediaFactory) {}

  async editarPerfil(
    usuarioId: number, datos: DatosPerfil, foto?: ArchivoSubido,
  ): Promise<ReturnType<Usuario['toPublico']>> {
    const actual = await this.perfiles.buscarPorId(usuarioId);
    if (!actual) throw new NotFoundError('Usuario no encontrado');

    // 1) Validaciones (sin efectos secundarios)
    let nombre = actual.nombre;
    if (datos.nombre !== undefined) {
      nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
      if (!nombre) throw new ValidationError('El nombre no puede estar vacío');
      if (nombre.length > 100) throw new ValidationError('El nombre no puede superar 100 caracteres');
    }

    let nivel = actual.nivelExperiencia;
    if (datos.nivelExperiencia !== undefined) {
      if (!NIVELES.includes(datos.nivelExperiencia as NivelExperiencia)) {
        throw new ValidationError('Nivel de experiencia inválido');
      }
      nivel = datos.nivelExperiencia as NivelExperiencia;
    }

    let biografia = actual.biografia;
    if (datos.biografia !== undefined) {
      const b = typeof datos.biografia === 'string' ? datos.biografia.trim() : '';
      if (b.length > MAX_BIOGRAFIA) throw new ValidationError(`La biografía no puede superar ${MAX_BIOGRAFIA} caracteres`);
      biografia = b || null;
    }

    if (foto) this.medios.crearValidador().validar(foto); // 'Formato no permitido, usa JPG o PNG'

    // 2) Efectos: guardar foto nueva, actualizar BD y recién entonces borrar la foto anterior
    const almacenamiento = this.medios.crearAlmacenamiento();
    const fotoNueva = foto ? await almacenamiento.guardar(foto) : actual.fotoPerfil;
    let actualizado: Usuario;
    try {
      actualizado = await this.perfiles.actualizarPerfil(usuarioId, {
        nombre, nivelExperiencia: nivel, biografia, fotoPerfil: fotoNueva,
      });
    } catch (err) {
      if (foto && fotoNueva) await almacenamiento.eliminar(fotoNueva); // no dejar huérfanos
      throw err;
    }
    if (foto && actual.fotoPerfil) await almacenamiento.eliminar(actual.fotoPerfil);
    return actualizado.toPublico();
  }
}
