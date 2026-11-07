export type Privacidad = 'publica' | 'solo_amigos' | 'privada';
export const PRIVACIDADES: Privacidad[] = ['publica', 'solo_amigos', 'privada'];

export interface ContextoVisibilidad {
  privacidad: Privacidad;
  esElMismo: boolean;
  espectadorSigueAlAutor: boolean;
  autorSigueAlEspectador: boolean;
}

export function puedeVerContenido(c: ContextoVisibilidad): boolean {
  if (c.esElMismo) return true;
  switch (c.privacidad) {
    case 'publica': return true;
    case 'privada': return c.espectadorSigueAlAutor;
    case 'solo_amigos': return c.espectadorSigueAlAutor && c.autorSigueAlEspectador;
    default: return false;
  }
}

export function estadoInicialDeSeguimiento(privacidad: Privacidad): 'aceptado' | 'pendiente' {
  return privacidad === 'publica' ? 'aceptado' : 'pendiente';
}
