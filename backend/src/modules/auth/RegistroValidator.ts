import { ValidationError } from '../../shared/errors/AppError';

export interface DatosRegistro {
  nombre?: unknown;
  correo?: unknown;
  contrasena?: unknown;
}

export interface DatosRegistroValidos {
  nombre: string;
  correo: string;
  contrasena: string;
}

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_CONTRASENA = 8;

/**
 * SRP: solo valida el formulario de registro (HU-001). Las validaciones quedan
 * centralizadas aquí; los mensajes son los de los criterios de aceptación.
 */
export class RegistroValidator {
  validar(datos: DatosRegistro): DatosRegistroValidos {
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    if (!nombre) throw new ValidationError('El nombre es obligatorio');

    const correo = typeof datos.correo === 'string' ? datos.correo.trim().toLowerCase() : '';
    if (!REGEX_CORREO.test(correo)) throw new ValidationError('Formato de correo inválido');

    const contrasena = typeof datos.contrasena === 'string' ? datos.contrasena : '';
    if (contrasena.length < MIN_CONTRASENA) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
    }
    return { nombre, correo, contrasena };
  }
}
