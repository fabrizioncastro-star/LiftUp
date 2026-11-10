import { RequestHandler, Router } from 'express';
import { manejar, usuarioId } from '../../shared/http';
import { INotificador } from '../notificaciones';
import { ProgresoRepository } from './infra';
import { LogroService, ProgresoService, RecordService } from './progreso';

export interface ProgresoModulo {
  router: Router;
  alPublicar: (usuarioId: number) => Promise<void>;
}

export function crearProgresoModulo(authRequired: RequestHandler, notificador: INotificador): ProgresoModulo {
  const repo = new ProgresoRepository();
  const logros = new LogroService(repo, notificador);
  const progreso = new ProgresoService(repo);
  const records = new RecordService(repo, logros, notificador);

  const router = Router();
  router.get('/summary', authRequired, manejar(async (_req, res) => { res.json(await progreso.resumen(usuarioId(res))); }));
  router.get('/history', authRequired, manejar(async (req, res) => {
    res.json({ sesiones: await progreso.historial(usuarioId(res), req.query.pagina) });
  }));
  router.get('/records', authRequired, manejar(async (_req, res) => { res.json({ records: await records.listar(usuarioId(res)) }); }));
  router.post('/records', authRequired, manejar(async (req, res) => {
    res.status(201).json(await records.registrar(usuarioId(res), req.body ?? {}));
  }));
  router.get('/achievements', authRequired, manejar(async (_req, res) => { res.json({ logros: await logros.listar(usuarioId(res)) }); }));

  return { router, alPublicar: async (id) => { await logros.evaluar(id); } };
}
