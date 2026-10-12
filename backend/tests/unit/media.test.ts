import fs from 'fs';
import { AlmacenamientoLocal } from '../../src/modules/media/AlmacenamientoLocal';
import { PerfilMediaFactory, PublicacionMediaFactory } from '../../src/modules/media/MediaFactory';
import { detectarTipo } from '../../src/modules/media/tipos';
import { GIF, JPG, MOV, MP4, PDF, PNG, archivo, archivosEn, carpetaTemporal } from '../helpers/archivos';

describe('detectarTipo (firma del archivo)', () => {
  it.each([
    ['jpg', JPG], ['png', PNG], ['mp4', MP4], ['mov', MOV],
  ])('reconoce %s', (esperado, buf) => expect(detectarTipo(buf)).toBe(esperado));

  it.each([['gif', GIF], ['pdf', PDF], ['vacío', Buffer.alloc(0)], ['corto', Buffer.from([0xff])]])(
    'rechaza %s', (_n, buf) => expect(detectarTipo(buf)).toBeNull(),
  );
});

describe('Abstract Factory de medios (HU-004 / HU-005)', () => {
  const dir = carpetaTemporal();

  it('familia de PERFIL: acepta JPG/PNG y rechaza MP4 con el mensaje de HU-004', () => {
    const v = new PerfilMediaFactory(dir).crearValidador();
    expect(v.validar(archivo(JPG))).toBe('jpg');
    expect(v.validar(archivo(PNG))).toBe('png');
    expect(() => v.validar(archivo(MP4))).toThrow('Formato no permitido, usa JPG o PNG');
    expect(() => v.validar(archivo(GIF))).toThrow('Formato no permitido, usa JPG o PNG');
  });

  it('familia de PUBLICACIÓN: acepta JPG/PNG/MP4/MOV y rechaza otros con el mensaje de HU-005', () => {
    const v = new PublicacionMediaFactory(dir).crearValidador();
    ['jpg', 'png', 'mp4', 'mov'].forEach((t, i) => expect(v.validar(archivo([JPG, PNG, MP4, MOV][i]))).toBe(t));
    expect(() => v.validar(archivo(PDF))).toThrow('Formato no permitido');
  });

  it('valores límite de tamaño de la foto de perfil: 5 MB válido, 5 MB + 1 inválido', () => {
    const v = new PerfilMediaFactory(dir).crearValidador();
    const cinco = 5 * 1024 * 1024;
    expect(v.validar({ ...archivo(JPG), size: cinco })).toBe('jpg');
    expect(() => v.validar({ ...archivo(JPG), size: cinco + 1 })).toThrow('máximo de 5 MB');
  });

  it('cada familia guarda en su propia carpeta', async () => {
    const perfil = await new PerfilMediaFactory(dir).crearAlmacenamiento().guardar(archivo(JPG));
    const pub = await new PublicacionMediaFactory(dir).crearAlmacenamiento().guardar(archivo(MP4));
    expect(perfil).toMatch(/^\/uploads\/perfiles\/.+\.jpg$/);
    expect(pub).toMatch(/^\/uploads\/publicaciones\/.+\.mp4$/);
  });
});

describe('AlmacenamientoLocal (Adapter)', () => {
  it('guarda, y elimina solo dentro de su carpeta', async () => {
    const dir = carpetaTemporal();
    const alm = new AlmacenamientoLocal(dir, 'perfiles');
    const url = await alm.guardar(archivo(PNG));
    expect(archivosEn(dir)).toHaveLength(1);
    await alm.eliminar('/uploads/publicaciones/otro.png');
    await alm.eliminar('/uploads/perfiles/../../etc/passwd');
    expect(archivosEn(dir)).toHaveLength(1);
    await alm.eliminar(url);
    expect(archivosEn(dir)).toHaveLength(0);
    await expect(alm.eliminar(url)).resolves.toBeUndefined();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
