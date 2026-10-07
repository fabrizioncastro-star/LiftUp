import { AlmacenamientoLocal } from './AlmacenamientoLocal';
import { IAlmacenamiento } from './IAlmacenamiento';
import { IValidadorArchivo } from './IValidadorArchivo';
import { ValidadorPorFormato } from './ValidadorPorFormato';

const MB = 1024 * 1024;

/**
 * Patrón ABSTRACT FACTORY (creacional): crea una FAMILIA de objetos que deben ser coherentes
 * entre sí (validador + almacenamiento). Un perfil nunca debe mezclar el validador de fotos
 * de perfil con la carpeta de publicaciones; la fábrica concreta lo garantiza.
 * Usada por HU-004 (perfil) y HU-005 (publicaciones). OCP: nueva familia = nueva fábrica.
 */
export interface MediaFactory {
  crearValidador(): IValidadorArchivo;
  crearAlmacenamiento(): IAlmacenamiento;
}

/** Familia HU-004: solo JPG/PNG, máx. 5 MB, carpeta /uploads/perfiles. */
export class PerfilMediaFactory implements MediaFactory {
  constructor(private readonly baseDir: string) {}
  crearValidador(): IValidadorArchivo {
    return new ValidadorPorFormato(['jpg', 'png'], 'Formato no permitido, usa JPG o PNG', 5 * MB);
  }
  crearAlmacenamiento(): IAlmacenamiento {
    return new AlmacenamientoLocal(this.baseDir, 'perfiles');
  }
}

/** Familia HU-005: JPG/PNG/MP4 (y MOV de iPhone), máx. 100 MB, carpeta /uploads/publicaciones. */
export class PublicacionMediaFactory implements MediaFactory {
  constructor(private readonly baseDir: string) {}
  crearValidador(): IValidadorArchivo {
    return new ValidadorPorFormato(['jpg', 'png', 'mp4', 'mov'], 'Formato no permitido', 100 * MB);
  }
  crearAlmacenamiento(): IAlmacenamiento {
    return new AlmacenamientoLocal(this.baseDir, 'publicaciones');
  }
}
