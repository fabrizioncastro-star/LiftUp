import { CriterioOrden, FeedItem, IFeedRepository } from '../../src/modules/posts/domain/IFeedRepository';
import { FeedService } from '../../src/modules/posts/FeedService';
import { PrioridadSeguidosStrategy, SoloFechaStrategy } from '../../src/modules/posts/FeedStrategy';

const item = (id: number): FeedItem => ({
  id, comunidadId: null, totalReacciones: 0, miReaccion: null, totalComentarios: 0, descripcion: null, archivoUrl: '/x', tipoArchivo: 'imagen', ejercicio: null, pesoKg: null, series: null,
  repeticiones: null, fecha: new Date().toISOString(), autor: { id: 2, nombre: 'B', fotoPerfil: null }, esMia: false, deSeguido: false,
});

class FeedRepoFalso implements IFeedRepository {
  ultima?: { orden: CriterioOrden[]; limite: number; desplazamiento: number };
  constructor(private total: number) {}
  async listar(_v: number, orden: CriterioOrden[], limite: number, desplazamiento: number) {
    this.ultima = { orden, limite, desplazamiento };
    return Array.from({ length: this.total }, (_, i) => item(i + 1)).slice(desplazamiento, desplazamiento + limite);
  }
  async listarDeUsuario() { return []; }
  async listarDeComunidad() { return []; }
}

describe('FeedService (HU-006)', () => {
  it('Escenario 3: feed vacío -> lista vacía y sin más páginas', async () => {
    const r = await new FeedService(new FeedRepoFalso(0)).obtener(1);
    expect(r).toEqual({ publicaciones: [], pagina: 1, hayMas: false });
  });

  it('Escenarios 1 y 4: por defecto prioriza seguidos y luego fecha descendente', async () => {
    const repo = new FeedRepoFalso(3);
    await new FeedService(repo).obtener(1);
    expect(repo.ultima?.orden).toEqual(['seguidos', 'fecha']);
  });

  it('Strategy intercambiable: SoloFecha cambia el criterio sin tocar el service', async () => {
    const repo = new FeedRepoFalso(3);
    await new FeedService(repo, new SoloFechaStrategy()).obtener(1);
    expect(repo.ultima?.orden).toEqual(['fecha']);
    expect(new PrioridadSeguidosStrategy().criterios()).toEqual(['seguidos', 'fecha']);
  });

  it('paginación: pide limite+1 para saber si hay más y recorta el sobrante', async () => {
    const repo = new FeedRepoFalso(25);
    const p1 = await new FeedService(repo).obtener(1, 1, 10);
    expect(p1.publicaciones).toHaveLength(10);
    expect(p1.hayMas).toBe(true);
    expect(repo.ultima).toMatchObject({ limite: 11, desplazamiento: 0 });
    const p3 = await new FeedService(repo).obtener(1, 3, 10);
    expect(p3.publicaciones).toHaveLength(5);
    expect(p3.hayMas).toBe(false);
  });

  it.each([
    ['página 0 / límite 0 -> valores por defecto', 0, 0, 1, 20],
    ['basura -> valores por defecto', 'abc', 'xyz', 1, 20],
    ['límite 500 -> tope 50', 1, 500, 1, 50],
    ['página negativa -> 1', -4, 5, 1, 5],
  ])('%s', async (_n, pagina, limite, paginaEsperada, limiteEsperado) => {
    const repo = new FeedRepoFalso(1);
    const r = await new FeedService(repo).obtener(1, pagina, limite);
    expect(r.pagina).toBe(paginaEsperada);
    expect(repo.ultima?.limite).toBe(limiteEsperado + 1);
  });
});
