import { ISesionRepository } from '../../src/modules/auth/domain/ISesionRepository';
import { PublicacionMediaFactory } from '../../src/modules/media/MediaFactory';
import {
  AprobarSolicitudComando, DescartarReporteComando, EjecutorDeComandos, EliminarPublicacionComando, IHistorialRepository, SuspenderCuentaComando,
} from '../../src/modules/moderation/comandos';
import {
  EstadoReporte, IReporteRepository, MotivoReporte, ReportePendiente, ReporteService, TipoObjetivo,
} from '../../src/modules/moderation/reportes';
import { IPublicacionRepository, PublicacionFacade } from '../../src/modules/posts';
import { Publicacion } from '../../src/modules/posts/domain/Publicacion';
import { fabricaPara } from '../../src/modules/posts/domain/PublicacionFactory';
import { Administrador } from '../../src/modules/users/domain/Administrador';
import { EstadoCuenta, Usuario } from '../../src/modules/users/domain/Usuario';
import { IEstadoCuentaRepository } from '../../src/modules/users/repository/IUsuarioRepository';
import { crearAdminRequired } from '../../src/modules/auth/authMiddleware';
import { carpetaTemporal } from '../helpers/archivos';

class ReporteRepo implements IReporteRepository {
  filas: { rid: number; tipo: TipoObjetivo; oid: number; motivo: string; detalle: string | null; estado: EstadoReporte; id: number }[] = [];
  async existe(r: number, t: TipoObjetivo, o: number) { return this.filas.some((f) => f.rid === r && f.tipo === t && f.oid === o); }
  async crear(r: number, t: TipoObjetivo, o: number, m: MotivoReporte, d: string | null) { this.filas.push({ rid: r, tipo: t, oid: o, motivo: m, detalle: d, estado: 'pendiente', id: this.filas.length + 1 }); }
  async pendientes(): Promise<ReportePendiente[]> { return []; }
  async marcar(id: number, e: EstadoReporte) { const f = this.filas.find((x) => x.id === id && x.estado === 'pendiente'); if (f) f.estado = e; return Boolean(f); }
  async marcarPorObjetivo(t: TipoObjetivo, o: number, e: EstadoReporte) { this.filas.filter((f) => f.tipo === t && f.oid === o && f.estado === 'pendiente').forEach((f) => { f.estado = e; }); }
}

const pub = (id: number, autor: number) => fabricaPara('jpg').crear({ id, usuarioId: autor, descripcion: null, archivoUrl: '/uploads/publicaciones/x.jpg', ejercicio: null, pesoKg: null, series: null, repeticiones: null });
const pubRepo = (): IPublicacionRepository & { borradas: number[] } => {
  const r = { borradas: [] as number[], crear: async (p: Publicacion) => p, actualizar: async () => undefined,
    eliminar: async (id: number) => { r.borradas.push(id); }, buscarPorId: async (id: number) => (id === 10 ? pub(10, 2) : null) };
  return r;
};

class Cuentas implements IEstadoCuentaRepository {
  estados = new Map<number, EstadoCuenta>([[2, 'activo'], [9, 'activo']]);
  async buscarPorId(id: number) {
    if (!this.estados.has(id)) return null;
    const props = { id, nombre: `U${id}`, correo: `u${id}@x.com`, contrasenaHash: 'h', estado: this.estados.get(id) };
    return id === 9 ? new Administrador({ ...props, rol: 'admin' }) : new Usuario(props);
  }
  async actualizarEstado(id: number, e: EstadoCuenta) { this.estados.set(id, e); }
}

describe('ReporteService (HU-014)', () => {
  const montar = () => { const r = new ReporteRepo(); return { r, s: new ReporteService(r, pubRepo(), new Cuentas()) }; };

  it('Esc. 1: reportar una publicación ajena queda registrado', async () => {
    const { s, r } = montar();
    await s.reportarPublicacion(1, 10, 'spam', 'es publicidad');
    expect(r.filas).toMatchObject([{ rid: 1, tipo: 'publicacion', oid: 10, motivo: 'spam', detalle: 'es publicidad', estado: 'pendiente' }]);
  });

  it.each([
    ['detalle que no es texto', 123],
    ['detalle solo con espacios', '   '],
  ])('%s -> se guarda sin detalle', async (_n, detalle) => {
    const { s, r } = montar();
    await s.reportarPublicacion(1, 10, 'spam', detalle);
    expect(r.filas[0].detalle).toBeNull();
  });

  it('Esc. 2: reportar un usuario queda registrado (no hay notificación al reportado)', async () => {
    const { s, r } = montar();
    await s.reportarUsuario(1, 2, 'contenido_ofensivo', undefined);
    expect(r.filas[0]).toMatchObject({ tipo: 'usuario', oid: 2 });
  });

  it('Esc. 3: no se puede reportar dos veces lo mismo (409)', async () => {
    const { s } = montar();
    await s.reportarPublicacion(1, 10, 'spam', null);
    await expect(s.reportarPublicacion(1, 10, 'otro', null)).rejects.toMatchObject({ status: 409, message: 'Ya reportaste esta publicación' });
    await s.reportarUsuario(1, 2, 'spam', null);
    await expect(s.reportarUsuario(1, 2, 'spam', null)).rejects.toMatchObject({ status: 409, message: 'Ya reportaste a este usuario' });
  });

  it('otro usuario sí puede reportar lo mismo', async () => {
    const { s, r } = montar();
    await s.reportarPublicacion(1, 10, 'spam', null);
    await s.reportarPublicacion(3, 10, 'spam', null);
    expect(r.filas).toHaveLength(2);
  });

  it.each([
    ['motivo inválido', () => montar().s.reportarPublicacion(1, 10, 'molesto', null), 422],
    ['publicación propia', () => montar().s.reportarPublicacion(2, 10, 'spam', null), 422],
    ['publicación inexistente', () => montar().s.reportarPublicacion(1, 99, 'spam', null), 404],
    ['reportarse a sí mismo', () => montar().s.reportarUsuario(1, 1, 'spam', null), 422],
    ['usuario inexistente', () => montar().s.reportarUsuario(1, 77, 'spam', null), 404],
  ])('%s', async (_n, accion, status) => { await expect(accion()).rejects.toMatchObject({ status }); });
});

describe('Comandos del administrador (HU-011 y HU-015) — patrón Command', () => {
  const historial = (): IHistorialRepository & { filas: string[] } => {
    const h = { filas: [] as string[], registrar: async (_a: number, accion: string, tipo: string, id: number) => { h.filas.push(`${accion}:${tipo}:${id}`); }, listar: async () => [] };
    return h;
  };
  const avisos: { para: number; tipo: string }[] = [];
  const notificador = { notificar: async (para: number, tipo: string) => { avisos.push({ para, tipo }); } };
  beforeEach(() => { avisos.length = 0; });

  it('HU-015 esc. 2: eliminar publicación la borra, avisa al autor, marca los reportes y queda en el historial', async () => {
    const repoP = pubRepo(); const reportes = new ReporteRepo(); const h = historial();
    await reportes.crear(1, 'publicacion', 10, 'spam', null);
    const facade = new PublicacionFacade(repoP, new PublicacionMediaFactory(carpetaTemporal()));
    await new EjecutorDeComandos(h).ejecutar(9, new EliminarPublicacionComando(facade, notificador, reportes, 10));
    expect(repoP.borradas).toEqual([10]);
    expect(avisos).toEqual([{ para: 2, tipo: 'publicacion_eliminada' }]);
    expect(reportes.filas[0].estado).toBe('revisado');
    expect(h.filas).toEqual(['eliminar_publicacion:publicacion:10']);
  });

  it('HU-015 esc. 3: suspender cuenta cambia el estado, cierra sus sesiones y queda registrado', async () => {
    const cuentas = new Cuentas(); const h = historial(); let cerradas = 0;
    const sesiones = { eliminarTodasDe: async () => { cerradas++; } } as unknown as ISesionRepository;
    await new EjecutorDeComandos(h).ejecutar(9, new SuspenderCuentaComando(cuentas, sesiones, new ReporteRepo(), 2));
    expect(cuentas.estados.get(2)).toBe('suspendido');
    expect(cerradas).toBe(1);
    expect(h.filas).toEqual(['suspender_cuenta:usuario:2']);
  });

  it('no se puede suspender a un administrador (403), ni dos veces (409), ni a un inexistente (404)', async () => {
    const cuentas = new Cuentas();
    const sesiones = { eliminarTodasDe: async () => undefined } as unknown as ISesionRepository;
    const suspender = (id: number) => new SuspenderCuentaComando(cuentas, sesiones, new ReporteRepo(), id).ejecutar();
    await expect(suspender(9)).rejects.toMatchObject({ status: 403 });
    await suspender(2);
    await expect(suspender(2)).rejects.toMatchObject({ status: 409 });
    await expect(suspender(77)).rejects.toMatchObject({ status: 404 });
  });

  it('un comando que falla NO queda registrado en el historial', async () => {
    const h = historial();
    await expect(new EjecutorDeComandos(h).ejecutar(9, new DescartarReporteComando(new ReporteRepo(), 5))).rejects.toMatchObject({ status: 404 });
    expect(h.filas).toEqual([]);
  });

  it('aprobar solicitud delega en el servicio de comunidades y se registra', async () => {
    const h = historial();
    const solicitudes = { aprobar: async () => ({ comunidadId: 3, nombre: 'Yoga' }) } as never;
    await new EjecutorDeComandos(h).ejecutar(9, new AprobarSolicitudComando(solicitudes, 4));
    expect(h.filas).toEqual(['aprobar_solicitud_comunidad:solicitud_comunidad:4']);
  });
});

describe('Administrador (LSP) y adminRequired (AC002)', () => {
  it('LSP: un Administrador se comporta como un Usuario y además puede moderar', () => {
    const props = { id: 1, nombre: 'A', correo: 'a@a.com', contrasenaHash: 'h' };
    const comoUsuario: Usuario = new Administrador({ ...props, rol: 'admin' });
    expect(comoUsuario.toPublico()).toMatchObject({ nombre: 'A', correo: 'a@a.com', rol: 'admin' });
    expect(comoUsuario).toBeInstanceOf(Usuario);
    expect(comoUsuario.puedeModerar()).toBe(true);
    expect(new Usuario(props).puedeModerar()).toBe(false);
  });

  const correr = async (id: number) => {
    const next = jest.fn();
    await crearAdminRequired(new Cuentas())({} as never, { locals: { usuario: { id } } } as never, next);
    return next.mock.calls[0][0];
  };
  it('un administrador pasa; un usuario común recibe 403; un usuario inexistente recibe 403', async () => {
    expect(await correr(9)).toBeUndefined();
    expect(await correr(2)).toMatchObject({ status: 403, message: 'Se requiere rol de administrador' });
    expect(await correr(77)).toMatchObject({ status: 403 });
  });
});
