import {
  Comentario, ComentarioService, IComentarioRepository, IReaccionRepository, ReaccionService, ResumenReacciones, TipoReaccion,
} from '../../src/modules/interactions/interactions';
import { IPublicacionRepository, PublicacionFacade } from '../../src/modules/posts';
import { fabricaPara } from '../../src/modules/posts/domain/PublicacionFactory';

const pubRepo = (autorId = 1, existe = true): IPublicacionRepository => ({
  crear: async (p) => p, actualizar: async () => undefined, eliminar: async () => undefined,
  buscarPorId: async (id) => (existe ? fabricaPara('jpg').crear({ id, usuarioId: autorId, descripcion: null, archivoUrl: '/x', ejercicio: null, pesoKg: null, series: null, repeticiones: null }) : null),
});

class ReaccionRepo implements IReaccionRepository {
  mapa = new Map<string, TipoReaccion>();
  async obtener(p: number, u: number) { return this.mapa.get(`${p}-${u}`) ?? null; }
  async guardar(p: number, u: number, t: TipoReaccion) { this.mapa.set(`${p}-${u}`, t); }
  async quitar(p: number, u: number) { this.mapa.delete(`${p}-${u}`); }
  async resumen(p: number, u: number): Promise<ResumenReacciones> {
    const porTipo: Record<string, number> = {};
    [...this.mapa.entries()].filter(([k]) => k.startsWith(`${p}-`)).forEach(([, t]) => { porTipo[t] = (porTipo[t] ?? 0) + 1; });
    return { total: Object.values(porTipo).reduce((a, b) => a + b, 0), porTipo, miReaccion: this.mapa.get(`${p}-${u}`) ?? null };
  }
}

describe('ReaccionService (HU-007)', () => {
  it('Esc. 1: reaccionar actualiza el conteo', async () => {
    const s = new ReaccionService(new ReaccionRepo(), pubRepo());
    expect(await s.reaccionar(2, 10, 'fuerza')).toMatchObject({ total: 1, miReaccion: 'fuerza' });
  });

  it('Esc. 2: tocar la reacción activa la quita', async () => {
    const s = new ReaccionService(new ReaccionRepo(), pubRepo());
    await s.reaccionar(2, 10, 'fuerza');
    expect(await s.reaccionar(2, 10, 'fuerza')).toMatchObject({ total: 0, miReaccion: null });
  });

  it('tocar otra reacción cambia la existente (una por usuario)', async () => {
    const s = new ReaccionService(new ReaccionRepo(), pubRepo());
    await s.reaccionar(2, 10, 'me_gusta');
    expect(await s.reaccionar(2, 10, 'aplauso')).toMatchObject({ total: 1, miReaccion: 'aplauso', porTipo: { aplauso: 1 } });
  });

  it('varios usuarios suman; tipo inválido -> 422; publicación inexistente -> 404', async () => {
    const s = new ReaccionService(new ReaccionRepo(), pubRepo());
    await s.reaccionar(2, 10, 'me_gusta');
    expect((await s.reaccionar(3, 10, 'me_gusta')).total).toBe(2);
    await expect(s.reaccionar(2, 10, 'enojo')).rejects.toMatchObject({ status: 422, message: 'Tipo de reacción inválido' });
    await expect(new ReaccionService(new ReaccionRepo(), pubRepo(1, false)).reaccionar(2, 10, 'fuerza')).rejects.toMatchObject({ status: 404 });
  });
});

class ComentarioRepo implements IComentarioRepository {
  datos: (Comentario & { usuarioId: number })[] = [];
  async crear(p: number, u: number, texto: string) {
    const c = { id: this.datos.length + 1, publicacionId: p, texto, fecha: '', autor: { id: u, nombre: 'N', fotoPerfil: null }, usuarioId: u };
    this.datos.push(c); return c;
  }
  async listar(p: number) { return this.datos.filter((c) => c.publicacionId === p); }
  async buscarPorId(id: number) { const c = this.datos.find((x) => x.id === id); return c ? { id: c.id, usuarioId: c.usuarioId, publicacionId: c.publicacionId } : null; }
  async eliminar(id: number) { this.datos = this.datos.filter((c) => c.id !== id); }
}

describe('ComentarioService (HU-007)', () => {
  const avisos: number[] = [];
  const notificador = { notificar: async (para: number) => { avisos.push(para); } };
  beforeEach(() => { avisos.length = 0; });

  it('Esc. 3: el comentario aparece en la lista y se avisa al autor de la publicación', async () => {
    const s = new ComentarioService(new ComentarioRepo(), pubRepo(1), notificador);
    await s.crear(2, 10, '  ¡Buen trabajo!  ', 'Ana');
    expect((await s.listar(10)).map((c) => c.texto)).toEqual(['¡Buen trabajo!']);
    expect(avisos).toEqual([1]);
  });

  it('comentar tu propia publicación no genera notificación', async () => {
    await new ComentarioService(new ComentarioRepo(), pubRepo(1), notificador).crear(1, 10, 'yo', 'Yo');
    expect(avisos).toEqual([]);
  });

  it.each([['vacío', ''], ['solo espacios', '   '], ['no es texto', 5], ['501 caracteres', 'x'.repeat(501)]])(
    'comentario %s -> 422', async (_n, texto) => {
      await expect(new ComentarioService(new ComentarioRepo(), pubRepo(), notificador).crear(2, 10, texto, 'A')).rejects.toMatchObject({ status: 422 });
    },
  );

  it('comentar una publicación inexistente -> 404 y no se crea nada', async () => {
    const repo = new ComentarioRepo();
    await expect(new ComentarioService(repo, pubRepo(1, false), notificador).crear(2, 10, 'hola', 'A')).rejects.toMatchObject({ status: 404 });
    expect(repo.datos).toHaveLength(0);
  });

  it('Esc. 4: el autor elimina su comentario; el ajeno -> 403; inexistente -> 404', async () => {
    const repo = new ComentarioRepo();
    const s = new ComentarioService(repo, pubRepo(), notificador);
    const c = await s.crear(2, 10, 'hola', 'A');
    await expect(s.eliminar(3, c.id)).rejects.toMatchObject({ status: 403 });
    await s.eliminar(2, c.id);
    expect(repo.datos).toHaveLength(0);
    await expect(s.eliminar(2, 99)).rejects.toMatchObject({ status: 404 });
  });
});

describe('PublicacionFacade: observadores (Observer)', () => {
  it('un observador que falla no rompe el publicar', async () => {
    const { PublicacionMediaFactory } = await import('../../src/modules/media/MediaFactory');
    const { archivo, carpetaTemporal, JPG } = await import('../helpers/archivos');
    const llamados: number[] = [];
    const facade = new PublicacionFacade(pubRepo(), new PublicacionMediaFactory(carpetaTemporal()), [
      async () => { throw new Error('boom'); },
      async (id) => { llamados.push(id); },
    ]);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(facade.publicar(7, archivo(JPG), {})).resolves.toBeDefined();
    expect(llamados).toEqual([7]);
    spy.mockRestore();
  });
});
