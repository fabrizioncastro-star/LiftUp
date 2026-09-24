import { crearServicio } from '../helpers/fakes';

describe('AuthService.iniciarSesion (HU-002)', () => {
  it('Escenario 1: credenciales correctas -> token y usuario sin hash', async () => {
    const { service, usuarios, sesiones } = crearServicio();
    usuarios.sembrar('ana@correo.com', 'clave1234');
    const r = await service.iniciarSesion({ correo: ' ANA@correo.com ', contrasena: 'clave1234' });
    expect(r.token).toBe('token-1');
    expect(JSON.stringify(r)).not.toContain('hash(');
    expect(sesiones.sesiones).toHaveLength(1);
  });

  it('Escenario 2a: clave incorrecta -> 401 con mensaje genérico', async () => {
    const { service, usuarios, sesiones } = crearServicio();
    usuarios.sembrar('ana@correo.com', 'clave1234');
    await expect(service.iniciarSesion({ correo: 'ana@correo.com', contrasena: 'otra-clave' })).rejects.toMatchObject({
      message: 'Usuario o contraseña incorrectos', status: 401,
    });
    expect(sesiones.sesiones).toHaveLength(0);
  });

  it('Escenario 2b: correo inexistente -> mismo 401 (no revela si existe)', async () => {
    const { service } = crearServicio();
    await expect(service.iniciarSesion({ correo: 'nadie@correo.com', contrasena: 'clave1234' })).rejects.toMatchObject({
      message: 'Usuario o contraseña incorrectos', status: 401,
    });
  });

  it('campos vacíos o de tipo incorrecto -> 422', async () => {
    const { service } = crearServicio();
    await expect(service.iniciarSesion({})).rejects.toMatchObject({ status: 422 });
    await expect(service.iniciarSesion({ correo: 'a@b.com', contrasena: 123 })).rejects.toMatchObject({ status: 422 });
  });

  it('cuenta suspendida -> 403 y no abre sesión', async () => {
    const { service, usuarios, sesiones } = crearServicio();
    usuarios.sembrar('ana@correo.com', 'clave1234', 'suspendido');
    await expect(service.iniciarSesion({ correo: 'ana@correo.com', contrasena: 'clave1234' })).rejects.toMatchObject({ status: 403 });
    expect(sesiones.sesiones).toHaveLength(0);
  });

  it('Escenario 3: obtenerUsuario restaura al usuario; id inexistente -> 404', async () => {
    const { service, usuarios } = crearServicio();
    usuarios.sembrar('ana@correo.com', 'clave1234');
    expect((await service.obtenerUsuario(1)).correo).toBe('ana@correo.com');
    await expect(service.obtenerUsuario(99)).rejects.toMatchObject({ status: 404 });
  });
});
