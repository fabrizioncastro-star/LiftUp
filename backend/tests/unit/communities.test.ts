import {
  Comunidad, ComunidadService, DatosSolicitud, IComunidadRepository, ISolicitudRepository, SolicitudComunidad, SolicitudPendiente, SolicitudService,
} from '../../src/modules/communities/communities';
import { PublicacionMediaFactory } from '../../src/modules/media/MediaFactory';
import { FeedItem, IFeedRepository, PublicacionFacade } from '../../src/modules/posts';
import { Publicacion } from '../../src/modules/posts/domain/Publicacion';
import { fabricaPara } from '../../src/modules/posts/domain/PublicacionFactory';
import { JPG, archivo, carpetaTemporal } from '../helpers/archivos';

class ComRepo implements IComunidadRepository {
  comunidades: { id: number; nombre: string; tipo: string; descripcion: string | null; estado: string }[] = [
    { id: 1, nombre: 'Gym Miraflores', tipo: 'sede', descripcion: null, estado: 'activa' },
  ];
  miembros = new Set<string>();
  async listar(u: number, texto: string): Promise<Comunidad[]> {
    return this.comunidades.filter((c) => c.nombre.toLowerCase().includes(texto.toLowerCase()))
      .map((c) => ({ ...c, miembros: [...this.miembros].filter((m) => m.startsWith(`${c.id}-`)).length, esMiembro: this.miembros.has(`${c.id}-${u}`) }));
  }
  async mias(u: number) { return (await this.listar(u, '')).filter((c) => c.esMiembro); }
  async buscarPorId(id: number) { return this.comunidades.find((c) => c.id === id) ?? null; }
  async crear(d: DatosSolicitud) { const id = this.comunidades.length + 1; this.comunidades.push({ id, nombre: d.nombre, tipo: d.tipo, descripcion: d.descripcion, estado: 'activa' }); return id; }
  async unir(c: number, u: number) { this.miembros.add(`${c}-${u}`); }
  async esMiembro(c: number, u: number) { return this.miembros.has(`${c}-${u}`); }
}

class SolRepo implements ISolicitudRepository {
  datos: SolicitudComunidad[] = [];
  constructor(private comunidades: ComRepo) {}
  async crear(u: number, d: DatosSolicitud) { const s = new SolicitudComunidad(this.datos.length + 1, u, d); this.datos.push(s); return s; }
  async buscarPorId(id: number) { return this.datos.find((s) => s.id === id) ?? null; }
  async guardarEstado() { }
  async existeNombre(n: string) {
    return this.datos.some((s) => s.datos.nombre.toLowerCase() === n.toLowerCase() && s.estado !== 'rechazada')
      || this.comunidades.comunidades.some((c) => c.nombre.toLowerCase() === n.toLowerCase());
  }
  async pendientes(): Promise<SolicitudPendiente[]> { return []; }
  async delUsuario(u: number) { return this.datos.filter((s) => s.usuarioId === u); }
}

const avisos: { para: number; tipo: string }[] = [];
const notificador = { notificar: async (para: number, tipo: string) => { avisos.push({ para, tipo }); } };
beforeEach(() => { avisos.length = 0; });

describe('SolicitudService (HU-010 y HU-011)', () => {
  const montar = () => { const c = new ComRepo(); const r = new SolRepo(c); return { c, r, s: new SolicitudService(r, c, notificador) }; };
  const datos = { nombre: 'Calistenia Lima', tipo: 'disciplina', descripcion: 'Entrenamos en parques' };

  it('HU-010 esc. 1: la solicitud queda en estado pendiente', async () => {
    const sol = await montar().s.crear(5, datos);
    expect(sol.estado).toBe('pendiente');
    expect(sol.datos.nombre).toBe('Calistenia Lima');
  });

  it('HU-010 esc. 2: duplicada (misma o distinta mayúscula, o comunidad existente) -> 409', async () => {
    const { s } = montar();
    await s.crear(5, datos);
    await expect(s.crear(5, { ...datos, nombre: 'calistenia lima' })).rejects.toMatchObject({ status: 409, message: 'Ya existe una solicitud para esa comunidad' });
    await expect(s.crear(6, { ...datos, nombre: 'GYM MIRAFLORES' })).rejects.toMatchObject({ status: 409 });
  });

  it('una solicitud rechazada permite volver a pedir el mismo nombre', async () => {
    const { s } = montar();
    const sol = await s.crear(5, datos);
    await s.rechazar(sol.id);
    await expect(s.crear(5, datos)).resolves.toBeDefined();
  });

  it.each([
    ['nombre muy corto', { ...datos, nombre: 'ab' }],
    ['nombre largo', { ...datos, nombre: 'x'.repeat(151) }],
    ['sin tipo', { ...datos, tipo: ' ' }],
    ['descripción larga', { ...datos, descripcion: 'x'.repeat(501) }],
    ['nombre que no es texto', { ...datos, nombre: 123 }],
    ['tipo que no es texto', { ...datos, tipo: null }],
  ])('%s -> 422', async (_n, d) => { await expect(montar().s.crear(5, d)).rejects.toMatchObject({ status: 422 }); });

  it.each([['sin descripción', undefined], ['descripción solo con espacios', '   ']])(
    '%s -> se guarda con descripción vacía (null)', async (_n, descripcion) => {
      expect((await montar().s.crear(5, { ...datos, descripcion })).datos.descripcion).toBeNull();
    },
  );

  it('HU-011 esc. 1: aprobar crea la comunidad, une al solicitante y lo notifica', async () => {
    const { s, c } = montar();
    const sol = await s.crear(5, datos);
    const r = await s.aprobar(sol.id);
    expect(c.comunidades.find((x) => x.id === r.comunidadId)?.nombre).toBe('Calistenia Lima');
    expect(await c.esMiembro(r.comunidadId, 5)).toBe(true);
    expect(avisos).toEqual([{ para: 5, tipo: 'comunidad_aprobada' }]);
  });

  it('HU-011 esc. 2: rechazar notifica al solicitante', async () => {
    const { s } = montar();
    const sol = await s.crear(5, datos);
    await s.rechazar(sol.id);
    expect(avisos).toEqual([{ para: 5, tipo: 'comunidad_rechazada' }]);
  });

  it('no se puede resolver dos veces (409) ni una solicitud inexistente (404)', async () => {
    const { s } = montar();
    const sol = await s.crear(5, datos);
    await s.aprobar(sol.id);
    await expect(s.aprobar(sol.id)).rejects.toMatchObject({ status: 409 });
    await expect(s.rechazar(sol.id)).rejects.toMatchObject({ status: 409 });
    await expect(s.aprobar(99)).rejects.toMatchObject({ status: 404 });
  });
});

describe('SolicitudComunidad (dominio)', () => {
  it('solo una solicitud pendiente puede aprobarse o rechazarse', () => {
    const s = new SolicitudComunidad(1, 1, { nombre: 'x', tipo: 'y', descripcion: null });
    s.aprobar();
    expect(s.estado).toBe('aprobada');
    expect(() => s.rechazar()).toThrow('ya fue resuelta');
  });
});
