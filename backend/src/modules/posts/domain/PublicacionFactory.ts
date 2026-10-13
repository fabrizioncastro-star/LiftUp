import { TipoDetectado } from '../../media/tipos';
import { Publicacion, PublicacionFoto, PublicacionProps, PublicacionVideo, TipoArchivoPub } from './Publicacion';

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

export function fabricaPara(tipo: TipoDetectado): PublicacionFactory {
  return tipo === 'jpg' || tipo === 'png' ? FOTO : VIDEO;
}

export function fabricaPorTipoGuardado(tipo: TipoArchivoPub): PublicacionFactory {
  return tipo === 'imagen' ? FOTO : VIDEO;
}
