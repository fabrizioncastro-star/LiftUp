import { RequestHandler, Router } from 'express';
import { idDeRuta, manejar, usuarioId } from '../../shared/http';
import { INotificador } from '../notificaciones';
import { IFeedRepository } from '../posts';
import { SeguimientoRepository, UsuarioSocialRepository } from './infra';
import { PerfilPublicoService, SeguimientoService } from './social';

export function crearSocialRouter(authRequired: RequestHandler, feed: IFeedRepository, notificador: INotificador): Router {
  const usuarios = new UsuarioSocialRepository();
  const seguimientos = new SeguimientoRepository();
  const seguir = new SeguimientoService(seguimientos, usuarios, notificador);
  const perfiles = new PerfilPublicoService(usuarios, seguimientos, feed);

  const router = Router();
  router.get('/search', authRequired, manejar(async (req, res) => {
    res.json({ usuarios: await perfiles.buscar(usuarioId(res), req.query.q) });
  }));
  router.put('/privacy', authRequired, manejar(async (req, res) => {
    res.json({ privacidad: await seguir.cambiarPrivacidad(usuarioId(res), req.body?.privacidad) });
  }));
  router.get('/follow-requests', authRequired, manejar(async (_req, res) => {
    res.json({ solicitudes: await seguir.solicitudesPendientes(usuarioId(res)) });
  }));
  router.post('/follow-requests/:id/accept', authRequired, manejar(async (req, res) => {
    await seguir.aceptarSolicitud(usuarioId(res), idDeRuta(req, 'id', 'Solicitud no encontrada'));
    res.json({ ok: true });
  }));
  router.post('/follow-requests/:id/reject', authRequired, manejar(async (req, res) => {
    await seguir.rechazarSolicitud(usuarioId(res), idDeRuta(req, 'id', 'Solicitud no encontrada'));
    res.json({ ok: true });
  }));

  router.get('/:id', authRequired, manejar(async (req, res) => {
    res.json(await perfiles.verPerfil(usuarioId(res), idDeRuta(req, 'id', 'Usuario no encontrado')));
  }));
  router.post('/:id/follow', authRequired, manejar(async (req, res) => {
    res.json(await seguir.seguir(usuarioId(res), idDeRuta(req, 'id', 'Usuario no encontrado')));
  }));
  router.delete('/:id/follow', authRequired, manejar(async (req, res) => {
    await seguir.dejarDeSeguir(usuarioId(res), idDeRuta(req, 'id', 'Usuario no encontrado'));
    res.json({ ok: true });
  }));
  return router;
}
