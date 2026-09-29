import { Request, Response } from 'express';
import { crearAuthRequired } from '../../src/modules/auth/authMiddleware';
import { SesionRepoFalso, tokensFalso } from '../helpers/fakes';
import { Sesion } from '../../src/modules/auth/domain/Sesion';

async function ejecutar(authorization?: string, sesionesActivas: string[] = []) {
  const sesiones = new SesionRepoFalso();
  sesionesActivas.forEach((t) => sesiones.sesiones.push(new Sesion(1, t, new Date())));
  const mw = crearAuthRequired(tokensFalso, sesiones);
  const res = { locals: {} } as unknown as Response;
  const next = jest.fn();
  await mw({ headers: { authorization } } as Request, res, next);
  return { res, error: next.mock.calls[0]?.[0] };
}

describe('authRequired', () => {
  it('sin cabecera -> 401', async () => {
    expect((await ejecutar()).error).toMatchObject({ status: 401, message: 'Token no proporcionado' });
  });
  it('token mal firmado -> 401', async () => {
    expect((await ejecutar('Bearer basura')).error).toMatchObject({ status: 401, message: 'Token inválido o expirado' });
  });
  it('token válido pero sesión cerrada/inexistente -> 401', async () => {
    expect((await ejecutar('Bearer token-1')).error).toMatchObject({ status: 401, message: 'Sesión cerrada o expirada' });
  });
  it('token válido y sesión vigente -> pasa y deja el usuario en res.locals', async () => {
    const { res, error } = await ejecutar('Bearer token-1', ['token-1']);
    expect(error).toBeUndefined();
    expect(res.locals.usuario.id).toBe(1);
  });
});
