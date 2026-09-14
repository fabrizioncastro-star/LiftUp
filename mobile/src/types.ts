export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  fotoPerfil: string | null;
  nivelExperiencia: 'sin_experiencia' | 'principiante' | 'intermedio' | 'avanzado';
  biografia: string | null;
}

export interface FeedItem {
  id: number;
  descripcion: string | null;
  archivoUrl: string;
  tipoArchivo: 'imagen' | 'video';
  ejercicio: string | null;
  pesoKg: number | null;
  series: number | null;
  repeticiones: number | null;
  fecha: string;
  autor: { id: number; nombre: string; fotoPerfil: string | null };
  esMia: boolean;
  deSeguido: boolean;
}

export const NIVELES: { valor: Usuario['nivelExperiencia']; etiqueta: string }[] = [
  { valor: 'sin_experiencia', etiqueta: 'Sin experiencia' },
  { valor: 'principiante', etiqueta: 'Principiante' },
  { valor: 'intermedio', etiqueta: 'Intermedio' },
  { valor: 'avanzado', etiqueta: 'Avanzado' },
];
