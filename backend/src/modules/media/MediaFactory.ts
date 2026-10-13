import { AlmacenamientoLocal } from './AlmacenamientoLocal';
import { IAlmacenamiento } from './IAlmacenamiento';
import { IValidadorArchivo } from './IValidadorArchivo';
import { ValidadorPorFormato } from './ValidadorPorFormato';

const MB = 1024 * 1024;

export interface MediaFactory {
  crearValidador(): IValidadorArchivo;
  crearAlmacenamiento(): IAlmacenamiento;
}

export class PerfilMediaFactory implements MediaFactory {
  constructor(private readonly baseDir: string) {}
  crearValidador(): IValidadorArchivo {
    return new ValidadorPorFormato(['jpg', 'png'], 'Formato no permitido, usa JPG o PNG', 5 * MB);
  }
  crearAlmacenamiento(): IAlmacenamiento {
    return new AlmacenamientoLocal(this.baseDir, 'perfiles');
  }
}

export class PublicacionMediaFactory implements MediaFactory {
  constructor(private readonly baseDir: string) {}
  crearValidador(): IValidadorArchivo {
    return new ValidadorPorFormato(['jpg', 'png', 'mp4', 'mov'], 'Formato no permitido', 100 * MB);
  }
  crearAlmacenamiento(): IAlmacenamiento {
    return new AlmacenamientoLocal(this.baseDir, 'publicaciones');
  }
}
