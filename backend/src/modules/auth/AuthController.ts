import { NextFunction, Request, Response } from 'express';
import { AuthService } from './AuthService';

/** SRP: el controller solo traduce HTTP <-> service. Sin reglas de negocio ni SQL. */
export class AuthController {
  constructor(private readonly service: AuthService) {}

  registrar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json(await this.service.registrar(req.body ?? {}));
    } catch (err) {
      next(err);
    }
  };

  iniciarSesion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.iniciarSesion(req.body ?? {}));
    } catch (err) {
      next(err);
    }
  };

  cerrarSesion = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.cerrarSesion(res.locals.token);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };

  yo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ usuario: await this.service.obtenerUsuario(res.locals.usuario.id) });
    } catch (err) {
      next(err);
    }
  };
}
