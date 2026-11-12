export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  fotoPerfil: string | null;
  nivelExperiencia: 'sin_experiencia' | 'principiante' | 'intermedio' | 'avanzado';
  biografia: string | null;
  privacidad?: Privacidad;
}

export type Privacidad = 'publica' | 'solo_amigos' | 'privada';

export interface FeedItem {
  id: number;
  comunidadId: number | null;
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
  totalReacciones: number;
  miReaccion: string | null;
  totalComentarios: number;
}

export interface UsuarioBasico {
  id: number;
  nombre: string;
  fotoPerfil: string | null;
  nivelExperiencia: Usuario['nivelExperiencia'];
  biografia: string | null;
  privacidad: Privacidad;
}

export interface PerfilPublico {
  usuario: UsuarioBasico;
  seguidores: number;
  seguidos: number;
  relacion: 'yo' | 'ninguna' | 'pendiente' | 'siguiendo';
  teSigue: boolean;
  puedeVerContenido: boolean;
  publicaciones: FeedItem[];
}

export interface Comentario {
  id: number;
  texto: string;
  fecha: string;
  autor: { id: number; nombre: string; fotoPerfil: string | null };
}

export interface Notificacion {
  id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
}

export interface Comunidad {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  miembros: number;
  esMiembro: boolean;
}

export interface SolicitudComunidad {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface RecordPersonal { id: number; ejercicio: string; peso: number; fecha: string }
export interface Logro { codigo: string; nombre: string; fechaObtenido: string }
export interface ResumenProgreso { rachaActual: number; rachaMaxima: number; totalSesiones: number }
export interface SesionHistorial {
  id: number; fecha: string; descripcion: string | null; ejercicio: string | null;
  pesoKg: number | null; series: number | null; repeticiones: number | null;
}

export interface ReporteAdmin {
  id: number;
  tipo: 'publicacion' | 'usuario';
  objetivoId: number;
  motivo: string;
  detalle: string | null;
  fecha: string;
  reportante: { id: number; nombre: string };
  publicacion: { id: number; descripcion: string | null; archivoUrl: string; tipoArchivo: string; autor: { id: number; nombre: string } } | null;
  usuario: { id: number; nombre: string; estado: string } | null;
}

export interface SolicitudAdmin {
  id: number; nombre: string; tipo: string; descripcion: string | null; fecha: string;
  solicitante: { id: number; nombre: string };
}

export interface AccionHistorial {
  id: number; admin: string; accion: string; objetivoTipo: string; objetivoId: number; detalle: string | null; fecha: string;
}

export const NIVELES: { valor: Usuario['nivelExperiencia']; etiqueta: string }[] = [
  { valor: 'sin_experiencia', etiqueta: 'Sin experiencia' },
  { valor: 'principiante', etiqueta: 'Principiante' },
  { valor: 'intermedio', etiqueta: 'Intermedio' },
  { valor: 'avanzado', etiqueta: 'Avanzado' },
];

export const MOTIVOS_REPORTE: { valor: string; etiqueta: string }[] = [
  { valor: 'contenido_ofensivo', etiqueta: 'Contenido ofensivo' },
  { valor: 'spam', etiqueta: 'Spam' },
  { valor: 'desinformacion', etiqueta: 'Desinformación' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export const REACCIONES: { tipo: string; icono: string; etiqueta: string }[] = [
  { tipo: 'me_gusta', icono: '👍', etiqueta: 'Me gusta' },
  { tipo: 'fuerza', icono: '💪', etiqueta: 'Fuerza' },
  { tipo: 'aplauso', icono: '👏', etiqueta: 'Aplauso' },
];
