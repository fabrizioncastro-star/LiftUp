import { INotificador } from '../../src/modules/notificaciones';
import {
  IProgresoRepository, LogroObtenido, LogroService, ProgresoService, REGLAS_LOGRO, RecordPersonal, RecordService,
} from '../../src/modules/progreso/progreso';
import { calcularRacha, diaDe } from '../../src/modules/progreso/racha';

describe('diaDe', () => {
  it('usa el día calendario de Lima (UTC-5), no el de UTC', () => {
    expect(diaDe(new Date('2026-10-16T02:30:00Z'))).toBe('2026-10-15');
    expect(diaDe(new Date('2026-10-16T05:00:00Z'))).toBe('2026-10-16');
  });
});

describe('calcularRacha (HU-012)', () => {
  const hoy = '2026-10-15';
  it('C1: sin sesiones -> 0 y 0', () => expect(calcularRacha([], hoy)).toEqual({ actual: 0, maxima: 0 }));
  it('C2: publicó hoy y ayer -> racha 2', () => expect(calcularRacha(['2026-10-14', hoy], hoy)).toEqual({ actual: 2, maxima: 2 }));
  it('C3: esc. 1: 3 días consecutivos terminando hoy -> 3', () =>
    expect(calcularRacha(['2026-10-13', '2026-10-14', hoy], hoy)).toEqual({ actual: 3, maxima: 3 }));
  it('C4: no publicó hoy pero sí ayer -> la racha sigue viva', () =>
    expect(calcularRacha(['2026-10-13', '2026-10-14'], hoy)).toEqual({ actual: 2, maxima: 2 }));
  it('C5: esc. 2: saltó un día completo (ni hoy ni ayer) -> racha actual 0, máxima se conserva', () =>
    expect(calcularRacha(['2026-10-10', '2026-10-11', '2026-10-12'], hoy)).toEqual({ actual: 0, maxima: 3 }));
  it('C6: hueco en medio -> la racha actual solo cuenta el tramo final', () =>
    expect(calcularRacha(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-14', hoy], hoy)).toEqual({ actual: 2, maxima: 4 }));
  it('C7: varias sesiones el mismo día cuentan como un día', () =>
    expect(calcularRacha([hoy, hoy, hoy], hoy)).toEqual({ actual: 1, maxima: 1 }));
  it('C8: cruza de mes correctamente', () =>
    expect(calcularRacha(['2026-09-29', '2026-09-30', '2026-10-01'], '2026-10-01')).toEqual({ actual: 3, maxima: 3 }));
});

class Repo implements IProgresoRepository {
  sesiones: Date[] = [];
  records: RecordPersonal[] = [];
  logros = new Map<string, LogroObtenido>();
  async fechasDeSesiones() { return this.sesiones; }
  async historial() { return []; }
  async maximoPeso(_u: number, e: string) {
    const r = this.records.filter((x) => x.ejercicio.toLowerCase() === e.toLowerCase());
    return r.length ? Math.max(...r.map((x) => x.peso)) : null;
  }
  async insertarRecord(_u: number, ejercicio: string, peso: number, fecha: string) {
    const r = { id: this.records.length + 1, ejercicio, peso, fecha }; this.records.push(r); return r;
  }
  async listarRecords() { return this.records; }
  async contarRecords() { return this.records.length; }
  async listarLogros() { return [...this.logros.values()]; }
  async otorgarLogro(_u: number, codigo: string, nombre: string) {
    if (this.logros.has(codigo)) return false;
    this.logros.set(codigo, { codigo, nombre, fechaObtenido: '' }); return true;
  }
}

const mensajes: string[] = [];
const notificador: INotificador = { notificar: async (_u, _t, m) => { mensajes.push(m); } };
beforeEach(() => { mensajes.length = 0; });
const hoy = () => '2026-10-15';
const dia = (d: string) => new Date(`${d}T17:00:00Z`);

describe('ProgresoService (HU-012)', () => {
  it('resumen: racha actual, máxima y total de sesiones', async () => {
    const repo = new Repo();
    repo.sesiones = [dia('2026-10-13'), dia('2026-10-14'), dia('2026-10-15'), dia('2026-10-15')];
    expect(await new ProgresoService(repo, hoy).resumen(1)).toEqual({ rachaActual: 3, rachaMaxima: 3, totalSesiones: 4 });
  });
  it('esc. 4: al publicar una sesión más, el total sube en uno', async () => {
    const repo = new Repo(); const s = new ProgresoService(repo, hoy);
    repo.sesiones = [dia('2026-10-15')];
    const antes = (await s.resumen(1)).totalSesiones;
    repo.sesiones.push(dia('2026-10-15'));
    expect((await s.resumen(1)).totalSesiones).toBe(antes + 1);
  });
});

describe('RecordService (HU-013)', () => {
  const montar = () => { const repo = new Repo(); const logros = new LogroService(repo, notificador, REGLAS_LOGRO, hoy); return { repo, s: new RecordService(repo, logros, notificador, hoy) }; };

  it('Esc. 1: registra el récord; el primero no se destaca pero desbloquea "Primer récord"', async () => {
    const { s } = montar();
    const r = await s.registrar(1, { ejercicio: ' Sentadilla ', peso: '100', fecha: '2026-10-10' });
    expect(r.record).toMatchObject({ ejercicio: 'Sentadilla', peso: 100 });
    expect(r.esNuevoRecord).toBe(false);
    expect(r.logrosNuevos.map((l) => l.codigo)).toContain('primer_record');
  });

  it('Esc. 2: superar el récord previo del mismo ejercicio (sin distinguir mayúsculas) lo destaca y notifica', async () => {
    const { s } = montar();
    await s.registrar(1, { ejercicio: 'Sentadilla', peso: 100 });
    const r = await s.registrar(1, { ejercicio: 'sentadilla', peso: 110 });
    expect(r.esNuevoRecord).toBe(true);
    expect(mensajes.some((m) => m.includes('Nuevo récord'))).toBe(true);
  });

  it('igualar o bajar el peso NO es récord nuevo; otro ejercicio tampoco', async () => {
    const { s } = montar();
    await s.registrar(1, { ejercicio: 'Press', peso: 60 });
    expect((await s.registrar(1, { ejercicio: 'Press', peso: 60 })).esNuevoRecord).toBe(false);
    expect((await s.registrar(1, { ejercicio: 'Press', peso: 50 })).esNuevoRecord).toBe(false);
    expect((await s.registrar(1, { ejercicio: 'Remo', peso: 200 })).esNuevoRecord).toBe(false);
  });

  it.each([
    ['ejercicio vacío', { ejercicio: ' ', peso: 10 }],
    ['sin peso', { ejercicio: 'A' }],
    ['peso 0', { ejercicio: 'A', peso: 0 }],
    ['peso negativo', { ejercicio: 'A', peso: -5 }],
    ['peso mayor a 1000', { ejercicio: 'A', peso: 1001 }],
    ['peso no numérico', { ejercicio: 'A', peso: 'pesado' }],
    ['fecha con formato inválido', { ejercicio: 'A', peso: 10, fecha: '15/10/2026' }],
    ['fecha futura', { ejercicio: 'A', peso: 10, fecha: '2026-10-16' }],
  ])('%s -> 422', async (_n, datos) => {
    await expect(montar().s.registrar(1, datos)).rejects.toMatchObject({ status: 422 });
  });

  it('sin fecha usa hoy', async () => {
    expect((await montar().s.registrar(1, { ejercicio: 'A', peso: 10 })).record.fecha).toBe('2026-10-15');
  });
});

describe('LogroService (HU-013) — Strategy', () => {
  it('Esc. 3: al cumplir el criterio otorga el logro y notifica una sola vez', async () => {
    const repo = new Repo(); repo.sesiones = [dia('2026-10-15')];
    const s = new LogroService(repo, notificador, REGLAS_LOGRO, hoy);
    expect((await s.evaluar(1)).map((l) => l.codigo)).toEqual(['primera_sesion']);
    expect(await s.evaluar(1)).toEqual([]);
    expect(mensajes.filter((m) => m.includes('Primera sesión'))).toHaveLength(1);
  });

  it('racha de 3 días y 10 sesiones desbloquean sus logros', async () => {
    const repo = new Repo();
    repo.sesiones = [dia('2026-10-13'), dia('2026-10-14'), dia('2026-10-15'), ...Array(7).fill(dia('2026-10-01'))];
    const codigos = (await new LogroService(repo, notificador, REGLAS_LOGRO, hoy).evaluar(1)).map((l) => l.codigo);
    expect(codigos).toEqual(expect.arrayContaining(['primera_sesion', 'racha_3', 'diez_sesiones']));
    expect(codigos).not.toContain('racha_7');
  });

  it('OCP: se puede agregar una regla nueva sin modificar el servicio', async () => {
    const repo = new Repo(); repo.sesiones = [dia('2026-10-15')];
    const regla = { codigo: 'x', nombre: 'Regla nueva', cumple: () => true };
    expect((await new LogroService(repo, notificador, [regla], hoy).evaluar(1)).map((l) => l.codigo)).toEqual(['x']);
  });
});
