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
