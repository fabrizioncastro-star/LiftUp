import { RequestHandler, Router } from 'express';
import { idDeRuta, manejar, usuarioId } from '../../shared/http';
import { ISesionRepository } from '../auth/domain/ISesionRepository';
import { SolicitudService } from '../communities';
import { INotificador } from '../notificaciones';
import { IPublicacionRepository, PublicacionFacade } from '../posts';
import { IEstadoCuentaRepository } from '../users/repository/IUsuarioRepository';
import {
  AprobarSolicitudComando, DescartarReporteComando, EjecutorDeComandos, EliminarPublicacionComando,
  RechazarSolicitudComando, SuspenderCuentaComando,
} from './comandos';
import { HistorialRepository, ReporteRepository } from './infra';
import { ReporteService } from './reportes';

export interface ModeracionDeps {
  authRequired: RequestHandler;
  adminRequired: RequestHandler;
  publicaciones: IPublicacionRepository;
  facade: PublicacionFacade;
  cuentas: IEstadoCuentaRepository;
  sesiones: ISesionRepository;
  solicitudes: SolicitudService;
  notificador: INotificador;
}

export function crearModeracionModulo(d: ModeracionDeps): { reportesRouter: Router; adminRouter: Router } {
  const reportesRepo = new ReporteRepository();
  const historial = new HistorialRepository();
  const reportes = new ReporteService(reportesRepo, d.publicaciones, d.cuentas);
  const ejecutor = new EjecutorDeComandos(historial);

  const reportesRouter = Router();
  reportesRouter.post('/posts/:id/reports', d.authRequired, manejar(async (req, res) => {
    await reportes.reportarPublicacion(usuarioId(res), idDeRuta(req, 'id', 'Publicación no encontrada'), req.body?.motivo, req.body?.detalle);
    res.status(201).json({ ok: true });
  }));
  reportesRouter.post('/users/:id/reports', d.authRequired, manejar(async (req, res) => {
    await reportes.reportarUsuario(usuarioId(res), idDeRuta(req, 'id', 'Usuario no encontrado'), req.body?.motivo, req.body?.detalle);
    res.status(201).json({ ok: true });
  }));

  const adminRouter = Router();
  adminRouter.use(d.authRequired, d.adminRequired);

  adminRouter.get('/reports', manejar(async (_req, res) => { res.json({ reportes: await reportesRepo.pendientes() }); }));
  adminRouter.post('/reports/:id/dismiss', manejar(async (req, res) => {
    await ejecutor.ejecutar(usuarioId(res), new DescartarReporteComando(reportesRepo, idDeRuta(req, 'id', 'Reporte no encontrado')));
    res.json({ ok: true });
  }));
  adminRouter.delete('/posts/:id', manejar(async (req, res) => {
    await ejecutor.ejecutar(usuarioId(res), new EliminarPublicacionComando(
      d.facade, d.notificador, reportesRepo, idDeRuta(req, 'id', 'Publicación no encontrada'),
    ));
    res.json({ ok: true });
  }));
  adminRouter.post('/users/:id/suspend', manejar(async (req, res) => {
    await ejecutor.ejecutar(usuarioId(res), new SuspenderCuentaComando(
      d.cuentas, d.sesiones, reportesRepo, idDeRuta(req, 'id', 'Usuario no encontrado'),
    ));
    res.json({ ok: true });
  }));

  adminRouter.get('/community-requests', manejar(async (_req, res) => { res.json({ solicitudes: await d.solicitudes.pendientes() }); }));
  adminRouter.post('/community-requests/:id/approve', manejar(async (req, res) => {
    await ejecutor.ejecutar(usuarioId(res), new AprobarSolicitudComando(d.solicitudes, idDeRuta(req, 'id', 'Solicitud no encontrada')));
    res.json({ ok: true });
  }));
  adminRouter.post('/community-requests/:id/reject', manejar(async (req, res) => {
    await ejecutor.ejecutar(usuarioId(res), new RechazarSolicitudComando(d.solicitudes, idDeRuta(req, 'id', 'Solicitud no encontrada')));
    res.json({ ok: true });
  }));
  adminRouter.get('/history', manejar(async (_req, res) => { res.json({ acciones: await historial.listar(50) }); }));

  return { reportesRouter, adminRouter };
}
