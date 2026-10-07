import { TipoDetectado } from '../../media/tipos';
import { Publicacion, PublicacionFoto, PublicacionProps, PublicacionVideo, TipoArchivoPub } from './Publicacion';

/**
 * Patrón FACTORY METHOD (creacional): el "creador" abstracto declara crear(); cada subclase
 * decide qué clase concreta de Publicacion instanciar. El facade no usa `new PublicacionFoto`
 * ni `if (esVideo)`: agregar un tipo nuevo (p. ej. audio) = nueva fábrica, sin tocar el facade (OCP).
 */
export abstract class PublicacionFactory {
  abstract crear(props: PublicacionProps): Publicacion;
}

export class PublicacionFotoFactory extends PublicacionFactory {
  crear(props: PublicacionProps): Publicacion { return new PublicacionFoto(props); }
}

export class PublicacionVideoFactory extends PublicacionFactory {
  crear(props: PublicacionProps): Publicacion { return new PublicacionVideo(props); }
}

const FOTO = new PublicacionFotoFactory();
const VIDEO = new PublicacionVideoFactory();

/** Elige la fábrica según el tipo real del archivo detectado. */
export function fabricaPara(tipo: TipoDetectado): PublicacionFactory {
  return tipo === 'jpg' || tipo === 'png' ? FOTO : VIDEO;
}

/** Elige la fábrica según el tipo guardado en BD (para reconstruir desde filas). */
export function fabricaPorTipoGuardado(tipo: TipoArchivoPub): PublicacionFactory {
  return tipo === 'imagen' ? FOTO : VIDEO;
}
