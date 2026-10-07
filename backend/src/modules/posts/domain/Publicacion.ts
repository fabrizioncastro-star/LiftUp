export type TipoArchivoPub = 'imagen' | 'video';

export interface DatosEntrenamiento {
  ejercicio: string | null;
  pesoKg: number | null;
  series: number | null;
  repeticiones: number | null;
}

export interface PublicacionProps extends DatosEntrenamiento {
  id?: number;
  usuarioId: number;
  descripcion: string | null;
  archivoUrl: string;
  fecha?: Date;
}

export abstract class Publicacion {
  private readonly _id?: number;
  private readonly _usuarioId: number;
  private _descripcion: string | null;
  private readonly _archivoUrl: string;
  private _entrenamiento: DatosEntrenamiento;
  private readonly _fecha?: Date;

  protected constructor(p: PublicacionProps) {
    this._id = p.id;
    this._usuarioId = p.usuarioId;
    this._descripcion = p.descripcion;
    this._archivoUrl = p.archivoUrl;
    this._entrenamiento = { ejercicio: p.ejercicio, pesoKg: p.pesoKg, series: p.series, repeticiones: p.repeticiones };
    this._fecha = p.fecha;
  }

  abstract get tipoArchivo(): TipoArchivoPub;

  get id(): number | undefined { return this._id; }
  get usuarioId(): number { return this._usuarioId; }
  get descripcion(): string | null { return this._descripcion; }
  get archivoUrl(): string { return this._archivoUrl; }
  get entrenamiento(): DatosEntrenamiento { return this._entrenamiento; }
  get fecha(): Date | undefined { return this._fecha; }

  editar(descripcion: string | null, entrenamiento: DatosEntrenamiento): void {
    this._descripcion = descripcion;
    this._entrenamiento = entrenamiento;
  }

  esDe(usuarioId: number): boolean {
    return this._usuarioId === usuarioId;
  }
}

export class PublicacionFoto extends Publicacion {
  constructor(p: PublicacionProps) { super(p); }
  get tipoArchivo(): TipoArchivoPub { return 'imagen'; }
}

export class PublicacionVideo extends Publicacion {
  constructor(p: PublicacionProps) { super(p); }
  get tipoArchivo(): TipoArchivoPub { return 'video'; }
}
