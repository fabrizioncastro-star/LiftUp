import { crearServicio } from '../helpers/fakes';

describe('AuthService.cerrarSesion (HU-003)', () => {
  it('Escenario 1: invalida el token y deja de ser vigente', async () => {
    const { service, usuarios, sesiones } = crearServicio();
    usuarios.sembrar('ana@correo.com', 'clave1234');
    const { token } = await service.iniciarSesion({ correo: 'ana@correo.com', contrasena: 'clave1234' });
    expect(await sesiones.existeVigente(token)).toBe(true);
    await service.cerrarSesion(token);
    expect(await sesiones.existeVigente(token)).toBe(false);
  });

  it('Escenario 3: tras cerrar sesión el middleware rechaza el token (401)', async () => {
    const { service, usuarios, sesiones } = crearServicio();
    usuarios.sembrar('ana@correo.com', 'clave1234');
    const { token } = await service.iniciarSesion({ correo: 'ana@correo.com', contrasena: 'clave1234' });
    await service.cerrarSesion(token);
    const { crearAuthRequired } = await import('../../src/modules/auth/authMiddleware');
    const { tokensFalso } = await import('../helpers/fakes');
    const next = jest.fn();
    await crearAuthRequired(tokensFalso, sesiones)({ headers: { authorization: `Bearer ${token}` } } as never, { locals: {} } as never, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: 'Sesión cerrada o expirada' });
  });

  it('cerrar dos veces no falla (idempotente) y no afecta otras sesiones', async () => {
    const { service, usuarios, sesiones } = crearServicio();
    usuarios.sembrar('ana@correo.com', 'clave1234');
    const a = await service.iniciarSesion({ correo: 'ana@correo.com', contrasena: 'clave1234' });
    await service.cerrarSesion(a.token);
    await expect(service.cerrarSesion(a.token)).resolves.toBeUndefined();
    expect(sesiones.sesiones).toHaveLength(0);
  });
});
