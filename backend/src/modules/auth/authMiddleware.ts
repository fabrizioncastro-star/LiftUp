import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors/AppError';
import { IEstadoCuentaRepository } from '../users/repository/IUsuarioRepository';
import { ISesionRepository } from './domain/ISesionRepository';
import { ITokenService } from './domain/ITokenService';

export function crearAuthRequired(tokens: ITokenService, sesiones: ISesionRepository) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cabecera = req.headers.authorization ?? '';
      const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
      if (!token) throw new UnauthorizedError('Token no proporcionado');

      let payload;
      try {
        payload = tokens.verificar(token);
      } catch {
        throw new UnauthorizedError('Token inválido o expirado');
      }
      if (!(await sesiones.existeVigente(token))) throw new UnauthorizedError('Sesión cerrada o expirada');

      res.locals.usuario = payload;
      res.locals.token = token;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function crearAdminRequired(cuentas: IEstadoCuentaRepository) {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const usuario = await cuentas.buscarPorId(res.locals.usuario.id);
      if (!usuario || !usuario.puedeModerar()) throw new ForbiddenError('Se requiere rol de administrador');
      next();
    } catch (err) {
      next(err);
    }
  };
}
