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

export interface EstadisticasUsuario {
  totalSesiones: number;
  rachaMaxima: number;
  totalRecords: number;
}

export interface ILogroRegla {
  readonly codigo: string;
  readonly nombre: string;
  cumple(e: EstadisticasUsuario): boolean;
}

const regla = (codigo: string, nombre: string, cumple: (e: EstadisticasUsuario) => boolean): ILogroRegla => ({ codigo, nombre, cumple });

export const REGLAS_LOGRO: ILogroRegla[] = [
  regla('primera_sesion', 'Primera sesión publicada', (e) => e.totalSesiones >= 1),
  regla('racha_3', 'Constancia: 3 días seguidos', (e) => e.rachaMaxima >= 3),
  regla('racha_7', 'Semana completa: 7 días seguidos', (e) => e.rachaMaxima >= 7),
  regla('diez_sesiones', 'Diez sesiones publicadas', (e) => e.totalSesiones >= 10),
  regla('primer_record', 'Primer récord personal', (e) => e.totalRecords >= 1),
  regla('cinco_records', 'Coleccionista: 5 récords personales', (e) => e.totalRecords >= 5),
];

export class LogroService {
  constructor(
    private readonly repo: IProgresoRepository,
    private readonly notificador: INotificador,
    private readonly reglas: ILogroRegla[] = REGLAS_LOGRO,
    private readonly hoy: () => string = hoyEnLima,
  ) {}

  async evaluar(usuarioId: number): Promise<LogroObtenido[]> {
    const [fechas, totalRecords] = await Promise.all([this.repo.fechasDeSesiones(usuarioId), this.repo.contarRecords(usuarioId)]);
    const stats: EstadisticasUsuario = {
      totalSesiones: fechas.length,
      rachaMaxima: calcularRacha(fechas.map((f) => diaDe(f)), this.hoy()).maxima,
      totalRecords,
    };
    const nuevos: LogroObtenido[] = [];
    for (const r of this.reglas) {
      if (r.cumple(stats) && (await this.repo.otorgarLogro(usuarioId, r.codigo, r.nombre))) {
        nuevos.push({ codigo: r.codigo, nombre: r.nombre, fechaObtenido: new Date().toISOString() });
        await this.notificador.notificar(usuarioId, 'logro', `¡Logro desbloqueado: ${r.nombre}!`);
      }
    }
    return nuevos;
  }

  listar(usuarioId: number): Promise<LogroObtenido[]> {
    return this.repo.listarLogros(usuarioId);
  }
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

export interface DatosRecord {
  ejercicio?: unknown;
  peso?: unknown;
  fecha?: unknown;
}

export interface ResultadoRecord {
  record: RecordPersonal;
  esNuevoRecord: boolean;
  logrosNuevos: LogroObtenido[];
}

export class RecordService {
  constructor(
    private readonly repo: IProgresoRepository,
    private readonly logros: LogroService,
    private readonly notificador: INotificador,
    private readonly hoy: () => string = hoyEnLima,
  ) {}

  async registrar(usuarioId: number, datos: DatosRecord): Promise<ResultadoRecord> {
    const ejercicio = typeof datos.ejercicio === 'string' ? datos.ejercicio.trim() : '';
    if (!ejercicio) throw new ValidationError('El ejercicio es obligatorio');
    if (ejercicio.length > 150) throw new ValidationError('El ejercicio no puede superar 150 caracteres');

    const peso = Number(datos.peso);
    if (datos.peso === undefined || datos.peso === '' || !Number.isFinite(peso) || peso <= 0 || peso > 1000) {
      throw new ValidationError('El peso debe ser un número entre 0 y 1000 kg');
    }

    const hoy = this.hoy();
    const fecha = datos.fecha === undefined || datos.fecha === '' ? hoy : String(datos.fecha);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) throw new ValidationError('Fecha inválida');
    if (fecha > hoy) throw new ValidationError('La fecha no puede ser futura');

    const previo = await this.repo.maximoPeso(usuarioId, ejercicio);
    const record = await this.repo.insertarRecord(usuarioId, ejercicio, peso, fecha);
    const esNuevoRecord = previo !== null && peso > previo;
    if (esNuevoRecord) {
      await this.notificador.notificar(usuarioId, 'record', `¡Nuevo récord en ${ejercicio}: ${peso} kg! (antes ${previo} kg)`);
    }
    return { record, esNuevoRecord, logrosNuevos: await this.logros.evaluar(usuarioId) };
  }

  listar(usuarioId: number): Promise<RecordPersonal[]> {
    return this.repo.listarRecords(usuarioId);
  }
}
