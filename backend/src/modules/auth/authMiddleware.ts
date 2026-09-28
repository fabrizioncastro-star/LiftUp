import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors/AppError';
import { ISesionRepository } from './domain/ISesionRepository';
import { ITokenService } from './domain/ITokenService';

/**
 * Middleware de autenticación (AC002: todo acceso sin sesión válida -> 401).
 * Verifica firma/expiración del JWT y que la sesión siga vigente en BD.
 * Deja el payload en res.locals.usuario.
 */
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
