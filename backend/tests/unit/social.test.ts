import { INotificador } from '../../src/modules/notificaciones';
import { FeedItem, IFeedRepository } from '../../src/modules/posts';
import { estadoInicialDeSeguimiento, puedeVerContenido } from '../../src/modules/social/reglasVisibilidad';
import {
  EstadoSeguimiento, ISeguimientoRepository, IUsuarioSocialRepository, PerfilPublicoService, SeguimientoFila,
  SeguimientoService, UsuarioBasico,
} from '../../src/modules/social/social';
import { Privacidad } from '../../src/modules/social/reglasVisibilidad';

class SegRepo implements ISeguimientoRepository {
  filas: SeguimientoFila[] = [];
  private n = 0;
  async obtener(a: number, b: number) { return this.filas.find((f) => f.seguidorId === a && f.seguidoId === b) ?? null; }
  async buscarPorId(id: number) { return this.filas.find((f) => f.id === id) ?? null; }
  async crear(a: number, b: number, estado: EstadoSeguimiento) { this.filas.push({ id: ++this.n, seguidorId: a, seguidoId: b, estado }); }
  async eliminar(a: number, b: number) { const antes = this.filas.length; this.filas = this.filas.filter((f) => !(f.seguidorId === a && f.seguidoId === b)); return antes !== this.filas.length; }
  async eliminarPorId(id: number) { this.filas = this.filas.filter((f) => f.id !== id); }
  async aceptar(id: number) { const f = this.filas.find((x) => x.id === id); if (f) f.estado = 'aceptado'; }
  async aceptarPendientesDe(b: number) { this.filas.filter((f) => f.seguidoId === b).forEach((f) => { f.estado = 'aceptado'; }); }
  async pendientesDe(b: number) { return this.filas.filter((f) => f.seguidoId === b && f.estado === 'pendiente').map((f) => ({ id: f.id, fecha: '', seguidor: { id: f.seguidorId, nombre: 'X', fotoPerfil: null } })); }
  async contar(u: number) {
    return { seguidores: this.filas.filter((f) => f.seguidoId === u && f.estado === 'aceptado').length, seguidos: this.filas.filter((f) => f.seguidorId === u && f.estado === 'aceptado').length };
  }
}

class UsuRepo implements IUsuarioSocialRepository {
  constructor(public datos: Record<number, Privacidad> = { 1: 'publica', 2: 'publica', 3: 'privada', 4: 'solo_amigos' }) {}
  async buscarBasico(id: number): Promise<UsuarioBasico | null> {
    return this.datos[id] ? { id, nombre: `U${id}`, fotoPerfil: null, nivelExperiencia: 'principiante', biografia: null, privacidad: this.datos[id], estado: 'activo' } : null;
  }
  async buscarPorNombre() { return []; }
  async actualizarPrivacidad(id: number, p: Privacidad) { this.datos[id] = p; }
}

const notificaciones: { para: number; tipo: string }[] = [];
const notificador: INotificador = { notificar: async (para, tipo) => { notificaciones.push({ para, tipo }); } };
beforeEach(() => { notificaciones.length = 0; });

describe('reglasVisibilidad (HU-008)', () => {
  const base = { esElMismo: false, espectadorSigueAlAutor: false, autorSigueAlEspectador: false };
  it.each([
    ['pública: cualquiera', { privacidad: 'publica' as const }, true],
    ['privada sin seguir', { privacidad: 'privada' as const }, false],
    ['privada siguiendo', { privacidad: 'privada' as const, espectadorSigueAlAutor: true }, true],
    ['solo amigos: no lo sigo', { privacidad: 'solo_amigos' as const, autorSigueAlEspectador: true }, false],
    ['solo amigos: solo lo sigo', { privacidad: 'solo_amigos' as const, espectadorSigueAlAutor: true }, false],
    ['solo amigos: mutuo', { privacidad: 'solo_amigos' as const, espectadorSigueAlAutor: true, autorSigueAlEspectador: true }, true],
    ['privada: el propio dueño', { privacidad: 'privada' as const, esElMismo: true }, true],
  ])('%s', (_n, extra, esperado) => expect(puedeVerContenido({ ...base, ...extra })).toBe(esperado));

  it('privacidad desconocida (dato corrupto) -> no se muestra', () => {
    expect(puedeVerContenido({ ...base, privacidad: 'otra' as never, espectadorSigueAlAutor: true })).toBe(false);
  });

  it('seguir a pública es inmediato; a las demás queda pendiente', () => {
    expect(estadoInicialDeSeguimiento('publica')).toBe('aceptado');
    expect(estadoInicialDeSeguimiento('privada')).toBe('pendiente');
    expect(estadoInicialDeSeguimiento('solo_amigos')).toBe('pendiente');
  });
});

describe('SeguimientoService (HU-008)', () => {
  const montar = () => { const seg = new SegRepo(); const usu = new UsuRepo(); return { seg, usu, s: new SeguimientoService(seg, usu, notificador) }; };

  it('Esc. 1: seguir a cuenta pública -> aceptado y notifica "nuevo seguidor"', async () => {
    const { s, seg } = montar();
    expect(await s.seguir(1, 2)).toEqual({ estado: 'aceptado' });
    expect(seg.filas).toHaveLength(1);
    expect(notificaciones).toEqual([{ para: 2, tipo: 'nuevo_seguidor' }]);
  });

  it('seguir a cuenta privada -> pendiente y notifica la solicitud', async () => {
    const { s } = montar();
    expect(await s.seguir(1, 3)).toEqual({ estado: 'pendiente' });
    expect(notificaciones[0]).toEqual({ para: 3, tipo: 'solicitud_seguimiento' });
  });

  it('seguir dos veces es idempotente; no puede seguirse a sí mismo; usuario inexistente 404', async () => {
    const { s, seg } = montar();
    await s.seguir(1, 2); await s.seguir(1, 2);
    expect(seg.filas).toHaveLength(1);
    await expect(s.seguir(1, 1)).rejects.toMatchObject({ status: 422 });
    await expect(s.seguir(1, 99)).rejects.toMatchObject({ status: 404 });
  });

  it('Esc. 2: dejar de seguir elimina la relación', async () => {
    const { s, seg } = montar();
    await s.seguir(1, 2);
    await s.dejarDeSeguir(1, 2);
    expect(seg.filas).toHaveLength(0);
  });

  it('Esc. 4: el dueño acepta la solicitud y el solicitante pasa a ser seguidor (se le notifica)', async () => {
    const { s, seg } = montar();
    await s.seguir(1, 3);
    const [sol] = await s.solicitudesPendientes(3);
    await s.aceptarSolicitud(3, sol.id);
    expect(seg.filas[0].estado).toBe('aceptado');
    expect(notificaciones.at(-1)).toEqual({ para: 1, tipo: 'solicitud_aceptada' });
  });

  it('solo el destinatario puede aceptar (403) y no se puede aceptar dos veces (404)', async () => {
    const { s } = montar();
    await s.seguir(1, 3);
    const [sol] = await s.solicitudesPendientes(3);
    await expect(s.aceptarSolicitud(2, sol.id)).rejects.toMatchObject({ status: 403 });
    await s.aceptarSolicitud(3, sol.id);
    await expect(s.aceptarSolicitud(3, sol.id)).rejects.toMatchObject({ status: 404 });
  });

  it('rechazar elimina la solicitud', async () => {
    const { s, seg } = montar();
    await s.seguir(1, 3);
    const [sol] = await s.solicitudesPendientes(3);
    await s.rechazarSolicitud(3, sol.id);
    expect(seg.filas).toHaveLength(0);
  });

  it('Esc. 3: cambia la privacidad; valor inválido -> 422; pasar a pública acepta las pendientes', async () => {
    const { s, seg, usu } = montar();
    await s.seguir(1, 3);
    expect(await s.cambiarPrivacidad(3, 'publica')).toBe('publica');
    expect(usu.datos[3]).toBe('publica');
    expect(seg.filas[0].estado).toBe('aceptado');
    await expect(s.cambiarPrivacidad(3, 'secreta')).rejects.toMatchObject({ status: 422, message: 'Privacidad inválida' });
  });
});

describe('PerfilPublicoService (HU-008)', () => {
  const item = { id: 1 } as FeedItem;
  const feed: IFeedRepository = { listar: async () => [], listarDeComunidad: async () => [], listarDeUsuario: async () => [item] };

  it('perfil público: relación, conteos y publicaciones visibles', async () => {
    const seg = new SegRepo(); const usu = new UsuRepo();
    await seg.crear(1, 2, 'aceptado');
    const p = await new PerfilPublicoService(usu, seg, feed).verPerfil(1, 2);
    expect(p).toMatchObject({ relacion: 'siguiendo', seguidores: 1, puedeVerContenido: true, teSigue: false });
    expect(p.publicaciones).toHaveLength(1);
  });

  it('perfil privado sin seguir: no muestra publicaciones; con solicitud pendiente: relación "pendiente"', async () => {
    const seg = new SegRepo(); const svc = new PerfilPublicoService(new UsuRepo(), seg, feed);
    expect(await svc.verPerfil(1, 3)).toMatchObject({ relacion: 'ninguna', puedeVerContenido: false, publicaciones: [] });
    await seg.crear(1, 3, 'pendiente');
    expect((await svc.verPerfil(1, 3)).relacion).toBe('pendiente');
  });

  it('mi propio perfil: relación "yo" y siempre veo mi contenido; inexistente -> 404; búsqueda corta -> []', async () => {
    const svc = new PerfilPublicoService(new UsuRepo(), new SegRepo(), feed);
    expect(await svc.verPerfil(3, 3)).toMatchObject({ relacion: 'yo', puedeVerContenido: true });
    await expect(svc.verPerfil(1, 99)).rejects.toMatchObject({ status: 404 });
    expect(await svc.buscar(1, 'a')).toEqual([]);
  });
});
