import { PerfilMediaFactory } from '../../src/modules/media/MediaFactory';
import { NivelExperiencia, Usuario } from '../../src/modules/users/domain/Usuario';
import { CamposPerfil, IPerfilRepository } from '../../src/modules/users/repository/IPerfilRepository';
import { PerfilService } from '../../src/modules/users/PerfilService';
import { GIF, JPG, PNG, archivo, archivosEn, carpetaTemporal } from '../helpers/archivos';

class PerfilRepoFalso implements IPerfilRepository {
  llamadasActualizar = 0;
  constructor(public usuario: Usuario | null) {}
  async buscarPorId() { return this.usuario; }
  async actualizarPerfil(id: number, c: CamposPerfil) {
    this.llamadasActualizar++;
    this.usuario = new Usuario({
      id, nombre: c.nombre, correo: 'a@a.com', contrasenaHash: 'h', nivelExperiencia: c.nivelExperiencia,
      biografia: c.biografia, fotoPerfil: c.fotoPerfil,
    });
    return this.usuario;
  }
}

function montar(fotoInicial: string | null = null) {
  const dir = carpetaTemporal();
  const repo = new PerfilRepoFalso(new Usuario({ id: 1, nombre: 'Ana', correo: 'a@a.com', contrasenaHash: 'h', fotoPerfil: fotoInicial }));
  return { dir, repo, service: new PerfilService(repo, new PerfilMediaFactory(dir)) };
}

describe('PerfilService.editarPerfil (HU-004)', () => {
  it('Escenario 1: actualiza nombre, nivel, biografía y foto', async () => {
    const { service, dir } = montar();
    const r = await service.editarPerfil(1, { nombre: ' Ana María ', nivelExperiencia: 'intermedio', biografia: 'Me gusta levantar' }, archivo(JPG));
    expect(r).toMatchObject({ nombre: 'Ana María', nivelExperiencia: 'intermedio', biografia: 'Me gusta levantar' });
    expect(r.fotoPerfil).toMatch(/^\/uploads\/perfiles\/.+\.jpg$/);
    expect(archivosEn(dir)).toHaveLength(1);
  });

  it('Escenario 2: nombre vacío -> 422 y no guarda nada (ni la foto)', async () => {
    const { service, repo, dir } = montar();
    await expect(service.editarPerfil(1, { nombre: '   ' }, archivo(JPG))).rejects.toMatchObject({
      message: 'El nombre no puede estar vacío', status: 422,
    });
    expect(repo.llamadasActualizar).toBe(0);
    expect(archivosEn(dir)).toHaveLength(0);
  });

  it('Escenario 3: foto que no es JPG/PNG -> 422 y la foto anterior se conserva', async () => {
    const { service, repo } = montar('/uploads/perfiles/vieja.jpg');
    await expect(service.editarPerfil(1, { nombre: 'Ana' }, archivo(GIF))).rejects.toMatchObject({
      message: 'Formato no permitido, usa JPG o PNG', status: 422,
    });
    expect(repo.usuario?.fotoPerfil).toBe('/uploads/perfiles/vieja.jpg');
    expect(repo.llamadasActualizar).toBe(0);
  });

  it('reemplazar la foto borra la anterior del disco', async () => {
    const { service, dir } = montar();
    const primera = await service.editarPerfil(1, {}, archivo(JPG));
    expect(archivosEn(dir)).toHaveLength(1);
    const segunda = await service.editarPerfil(1, {}, archivo(PNG));
    expect(segunda.fotoPerfil).not.toBe(primera.fotoPerfil);
    expect(archivosEn(dir)).toHaveLength(1);
  });

  it.each([['nivel inválido', { nivelExperiencia: 'dios' }], ['biografía de 501 caracteres', { biografia: 'x'.repeat(501) }]])(
    '%s -> 422', async (_n, datos) => {
      const { service } = montar();
      await expect(service.editarPerfil(1, datos)).rejects.toMatchObject({ status: 422 });
    },
  );

  it.each(['sin_experiencia', 'principiante', 'intermedio', 'avanzado'] as NivelExperiencia[])('acepta nivel %s', async (n) => {
    const { service } = montar();
    expect((await service.editarPerfil(1, { nivelExperiencia: n })).nivelExperiencia).toBe(n);
  });

  it('usuario inexistente -> 404', async () => {
    const { service, repo } = montar();
    repo.usuario = null;
    await expect(service.editarPerfil(9, { nombre: 'X' })).rejects.toMatchObject({ status: 404 });
  });
});
