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
