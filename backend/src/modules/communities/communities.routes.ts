import { RequestHandler, Router } from 'express';
import { idDeRuta, manejar, usuarioId } from '../../shared/http';
import { archivoDe, subirUno } from '../media/upload';
import { INotificador } from '../notificaciones';
import { IFeedRepository, PublicacionFacade } from '../posts';
import { ComunidadRepository, SolicitudRepository } from './infra';
import { ComunidadService, SolicitudComunidad, SolicitudService } from './communities';

export interface ComunidadesModulo {
  router: Router;
  solicitudes: SolicitudService;
}

const aJson = (s: SolicitudComunidad) => ({
  id: s.id, ...s.datos, estado: s.estado, fecha: s.fecha,
});

export function crearComunidadesModulo(
  authRequired: RequestHandler, feed: IFeedRepository, publicaciones: PublicacionFacade, notificador: INotificador,
): ComunidadesModulo {
  const comunidadesRepo = new ComunidadRepository();
  const solicitudes = new SolicitudService(new SolicitudRepository(), comunidadesRepo, notificador);
  const comunidades = new ComunidadService(comunidadesRepo, feed, publicaciones);

  const router = Router();
  router.get('/', authRequired, manejar(async (req, res) => { res.json({ comunidades: await comunidades.listar(usuarioId(res), req.query.q) }); }));
  router.get('/mine', authRequired, manejar(async (_req, res) => { res.json({ comunidades: await comunidades.mias(usuarioId(res)) }); }));
  router.get('/requests/mine', authRequired, manejar(async (_req, res) => {
    res.json({ solicitudes: (await solicitudes.misSolicitudes(usuarioId(res))).map(aJson) });
  }));
  router.post('/requests', authRequired, manejar(async (req, res) => {
    res.status(201).json({ solicitud: aJson(await solicitudes.crear(usuarioId(res), req.body ?? {})) });
  }));

  router.post('/:id/join', authRequired, manejar(async (req, res) => {
    await comunidades.unirse(usuarioId(res), idDeRuta(req, 'id', 'Comunidad no encontrada'));
    res.status(201).json({ ok: true });
  }));
  router.get('/:id/feed', authRequired, manejar(async (req, res) => {
    res.json(await comunidades.verFeed(usuarioId(res), idDeRuta(req, 'id', 'Comunidad no encontrada'), req.query.pagina));
  }));
  router.post('/:id/posts', authRequired, subirUno('archivo'), manejar(async (req, res) => {
    const pub = await comunidades.publicar(usuarioId(res), idDeRuta(req, 'id', 'Comunidad no encontrada'), archivoDe(req), req.body ?? {});
    res.status(201).json({ publicacion: { id: pub.id, comunidadId: pub.comunidadId, archivoUrl: pub.archivoUrl, tipoArchivo: pub.tipoArchivo } });
  }));
  return { router, solicitudes };
}
