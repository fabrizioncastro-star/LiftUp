import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from './errors/AppError';

export const manejar = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => { fn(req, res).catch(next); };

export function idDeRuta(req: Request, nombre = 'id', mensaje = 'Recurso no encontrado'): number {
  const n = Number(req.params[nombre]);
  if (!Number.isInteger(n) || n <= 0) throw new NotFoundError(mensaje);
  return n;
}

export const usuarioId = (res: Response): number => res.locals.usuario.id as number;
