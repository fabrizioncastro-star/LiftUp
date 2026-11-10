import { ValidationError } from '../../shared/errors/AppError';
import { INotificador } from '../notificaciones';
import { calcularRacha, diaDe, hoyEnLima } from './racha';

export interface SesionHistorial {
  id: number;
  fecha: string;
  descripcion: string | null;
  ejercicio: string | null;
  pesoKg: number | null;
  series: number | null;
  repeticiones: number | null;
  tipoArchivo: 'imagen' | 'video';
  archivoUrl: string;
}

export interface RecordPersonal {
  id: number;
  ejercicio: string;
  peso: number;
  fecha: string;
}

export interface LogroObtenido {
  codigo: string;
  nombre: string;
  fechaObtenido: string;
}

export interface IProgresoRepository {
  fechasDeSesiones(usuarioId: number): Promise<Date[]>;
  historial(usuarioId: number, limite: number, desplazamiento: number): Promise<SesionHistorial[]>;
  maximoPeso(usuarioId: number, ejercicio: string): Promise<number | null>;
  insertarRecord(usuarioId: number, ejercicio: string, peso: number, fecha: string): Promise<RecordPersonal>;
  listarRecords(usuarioId: number): Promise<RecordPersonal[]>;
  contarRecords(usuarioId: number): Promise<number>;
  listarLogros(usuarioId: number): Promise<LogroObtenido[]>;
  otorgarLogro(usuarioId: number, codigo: string, nombre: string): Promise<boolean>;
}

export class ProgresoService {
  constructor(private readonly repo: IProgresoRepository, private readonly hoy: () => string = hoyEnLima) {}

  async resumen(usuarioId: number): Promise<{ rachaActual: number; rachaMaxima: number; totalSesiones: number }> {
    const fechas = await this.repo.fechasDeSesiones(usuarioId);
    const racha = calcularRacha(fechas.map((f) => diaDe(f)), this.hoy());
    return { rachaActual: racha.actual, rachaMaxima: racha.maxima, totalSesiones: fechas.length };
  }

  historial(usuarioId: number, pagina: unknown): Promise<SesionHistorial[]> {
    const p = Math.max(1, Math.floor(Number(pagina)) || 1);
    return this.repo.historial(usuarioId, 30, (p - 1) * 30);
  }
}
