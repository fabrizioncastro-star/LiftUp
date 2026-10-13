import { PublicacionMediaFactory } from '../../src/modules/media/MediaFactory';
import { IPublicacionRepository } from '../../src/modules/posts/domain/IPublicacionRepository';
import { Publicacion, PublicacionFoto, PublicacionVideo } from '../../src/modules/posts/domain/Publicacion';
import { fabricaPara } from '../../src/modules/posts/domain/PublicacionFactory';
import { PublicacionFacade } from '../../src/modules/posts/PublicacionFacade';
import { GIF, JPG, MOV, MP4, PNG, archivo, archivosEn, carpetaTemporal } from '../helpers/archivos';

class PubRepoFalso implements IPublicacionRepository {
  datos: Publicacion[] = [];
  fallar = false;
  async crear(p: Publicacion) {
    if (this.fallar) throw new Error('BD caída');
    const guardada = fabricaPara(p.tipoArchivo === 'imagen' ? 'jpg' : 'mp4').crear({
      id: this.datos.length + 1, usuarioId: p.usuarioId, descripcion: p.descripcion, archivoUrl: p.archivoUrl, ...p.entrenamiento,
    });
    this.datos.push(guardada);
    return guardada;
  }
  async buscarPorId(id: number) { return this.datos.find((p) => p.id === id) ?? null; }
  async actualizar() { /* el objeto ya está en memoria */ }
  async eliminar(id: number) { this.datos = this.datos.filter((p) => p.id !== id); }
}

function montar() {
  const dir = carpetaTemporal();
  const repo = new PubRepoFalso();
  return { dir, repo, facade: new PublicacionFacade(repo, new PublicacionMediaFactory(dir)) };
}

describe('Factory Method de publicaciones', () => {
  it.each([['jpg', PublicacionFoto, 'imagen'], ['png', PublicacionFoto, 'imagen'], ['mp4', PublicacionVideo, 'video'], ['mov', PublicacionVideo, 'video']] as const)(
    '%s -> clase concreta correcta', (tipo, clase, tipoArchivo) => {
      const p = fabricaPara(tipo).crear({ usuarioId: 1, descripcion: null, archivoUrl: '/x', ejercicio: null, pesoKg: null, series: null, repeticiones: null });
      expect(p).toBeInstanceOf(clase);
      expect(p.tipoArchivo).toBe(tipoArchivo);
    },
  );
});

describe('PublicacionFacade.publicar (HU-005)', () => {
  it('Escenario 1: foto JPG -> PublicacionFoto con archivo guardado', async () => {
    const { facade, dir } = montar();
    const p = await facade.publicar(1, archivo(JPG), { descripcion: 'Día de pierna', ejercicio: 'Sentadilla', pesoKg: '100.5', series: '4', repeticiones: '8' });
    expect(p).toBeInstanceOf(PublicacionFoto);
    expect(p.entrenamiento).toEqual({ ejercicio: 'Sentadilla', pesoKg: 100.5, series: 4, repeticiones: 8 });
    expect(archivosEn(dir)).toHaveLength(1);
  });

  it('Escenario 1: video MP4 y MOV -> PublicacionVideo', async () => {
    const { facade } = montar();
    expect((await facade.publicar(1, archivo(MP4), {})).tipoArchivo).toBe('video');
    expect((await facade.publicar(1, archivo(MOV), {})).tipoArchivo).toBe('video');
  });

  it('Escenario 2: formato inválido -> 422 "Formato no permitido" y no se guarda nada', async () => {
    const { facade, repo, dir } = montar();
    await expect(facade.publicar(1, archivo(GIF), {})).rejects.toMatchObject({ message: 'Formato no permitido', status: 422 });
    expect(repo.datos).toHaveLength(0);
    expect(archivosEn(dir)).toHaveLength(0);
  });

  it('sin archivo -> 422', async () => {
    const { facade } = montar();
    await expect(facade.publicar(1, undefined, {})).rejects.toMatchObject({ status: 422 });
  });

  it.each([['peso negativo', { pesoKg: '-5' }], ['peso no numérico', { pesoKg: 'abc' }], ['series decimales', { series: '2.5' }], ['repeticiones 0', { repeticiones: '0' }]])(
    'datos de entrenamiento inválidos (%s) -> 422 sin guardar archivo', async (_n, datos) => {
      const { facade, dir } = montar();
      await expect(facade.publicar(1, archivo(PNG), datos)).rejects.toMatchObject({ status: 422 });
      expect(archivosEn(dir)).toHaveLength(0);
    },
  );

  it('Escenario 5: si falla la BD se borra el archivo ya subido (compensación)', async () => {
    const { facade, repo, dir } = montar();
    repo.fallar = true;
    await expect(facade.publicar(1, archivo(JPG), {})).rejects.toThrow('BD caída');
    expect(archivosEn(dir)).toHaveLength(0);
  });
});

describe('PublicacionFacade.editar / eliminar (HU-005)', () => {
  it('Escenario 3: el autor edita la descripción', async () => {
    const { facade } = montar();
    const p = await facade.publicar(1, archivo(JPG), { descripcion: 'vieja', ejercicio: 'Press' });
    const e = await facade.editar(1, p.id as number, { descripcion: 'nueva' });
    expect(e.descripcion).toBe('nueva');
    expect(e.entrenamiento.ejercicio).toBe('Press'); // lo no enviado se conserva
  });

  it('editar o eliminar la publicación de otro -> 403; inexistente -> 404', async () => {
    const { facade } = montar();
    const p = await facade.publicar(1, archivo(JPG), {});
    await expect(facade.editar(2, p.id as number, { descripcion: 'x' })).rejects.toMatchObject({ status: 403 });
    await expect(facade.eliminar(2, p.id as number)).rejects.toMatchObject({ status: 403 });
    await expect(facade.editar(1, 99, {})).rejects.toMatchObject({ status: 404 });
  });

  it('Escenario 4: el autor elimina y se borra el archivo', async () => {
    const { facade, repo, dir } = montar();
    const p = await facade.publicar(1, archivo(MP4), {});
    await facade.eliminar(1, p.id as number);
    expect(repo.datos).toHaveLength(0);
    expect(archivosEn(dir)).toHaveLength(0);
  });

  it('descripción de 2001 caracteres -> 422', async () => {
    const { facade } = montar();
    await expect(facade.publicar(1, archivo(JPG), { descripcion: 'x'.repeat(2001) })).rejects.toMatchObject({ status: 422 });
  });
});
