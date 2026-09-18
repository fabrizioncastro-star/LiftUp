// Validación en el cliente: mismas reglas y mensajes que el backend (HU-001),
// para dar respuesta inmediata sin viaje a la red. El backend sigue siendo la fuente de verdad.
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ErroresRegistro {
  nombre?: string;
  correo?: string;
  contrasena?: string;
}

export function validarRegistro(nombre: string, correo: string, contrasena: string): ErroresRegistro {
  const errores: ErroresRegistro = {};
  if (!nombre.trim()) errores.nombre = 'El nombre es obligatorio';
  if (!REGEX_CORREO.test(correo.trim())) errores.correo = 'Formato de correo inválido';
  if (contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres';
  return errores;
}
