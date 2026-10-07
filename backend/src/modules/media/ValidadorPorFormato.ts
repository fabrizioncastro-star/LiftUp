import { ValidationError } from '../../shared/errors/AppError';
import { IValidadorArchivo } from './IValidadorArchivo';
import { ArchivoSubido, TipoDetectado, detectarTipo } from './tipos';

/** Valida tamaño y formato real (firma del archivo) contra una lista de formatos permitidos. */
export class ValidadorPorFormato implements IValidadorArchivo {
  constructor(
    private readonly permitidos: TipoDetectado[],
    private readonly mensajeFormato: string,
    private readonly maxBytes: number,
  ) {}

  validar(archivo: ArchivoSubido): TipoDetectado {
    const tipo = detectarTipo(archivo.buffer);
    if (!tipo || !this.permitidos.includes(tipo)) throw new ValidationError(this.mensajeFormato);
    if (archivo.size > this.maxBytes) {
      throw new ValidationError(`El archivo supera el máximo de ${Math.round(this.maxBytes / 1024 / 1024)} MB`);
    }
    return tipo;
  }
}
