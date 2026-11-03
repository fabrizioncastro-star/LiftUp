import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { NotificacionRepository } from './NotificacionRepository';
import { NotificacionService } from './NotificacionService';

export function crearNotificacionesModulo(authRequired: RequestHandler): { service: NotificacionService; router: Router } {
  const service = new NotificacionService(new NotificacionRepository());
  const manejar = (fn: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => { fn(req, res).catch(next); };

  const router = Router();
  router.get('/', authRequired, manejar(async (_req, res) => {
    res.json(await service.listar(res.locals.usuario.id));
  }));
  router.get('/count', authRequired, manejar(async (_req, res) => {
    res.json({ noLeidas: await service.contarNoLeidas(res.locals.usuario.id) });
  }));
  router.post('/read', authRequired, manejar(async (_req, res) => {
    await service.marcarTodasLeidas(res.locals.usuario.id);
    res.json({ ok: true });
  }));
  return { service, router };
}
