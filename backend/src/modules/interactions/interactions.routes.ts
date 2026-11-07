import { RequestHandler, Router } from 'express';
import { idDeRuta, manejar, usuarioId } from '../../shared/http';
import { IUsuarioRepository } from '../users/repository/IUsuarioRepository';
import { INotificador } from '../notificaciones';
import { IPublicacionRepository } from '../posts';
import { ComentarioRepository, ReaccionRepository } from './infra';
import { ComentarioService, ReaccionService, TIPOS_REACCION } from './interactions';

export function crearInteraccionesRouter(
  authRequired: RequestHandler, publicaciones: IPublicacionRepository, usuarios: IUsuarioRepository, notificador: INotificador,
): Router {
  const reacciones = new ReaccionService(new ReaccionRepository(), publicaciones);
  const comentarios = new ComentarioService(new ComentarioRepository(), publicaciones, notificador);

  const router = Router();
  router.get('/reaction-types', authRequired, manejar(async (_req, res) => { res.json({ tipos: TIPOS_REACCION }); }));

  router.post('/:id/reactions', authRequired, manejar(async (req, res) => {
    res.json(await reacciones.reaccionar(usuarioId(res), idDeRuta(req, 'id', 'Publicación no encontrada'), req.body?.tipo));
  }));
  router.get('/:id/comments', authRequired, manejar(async (req, res) => {
    res.json({ comentarios: await comentarios.listar(idDeRuta(req, 'id', 'Publicación no encontrada')) });
  }));
  router.post('/:id/comments', authRequired, manejar(async (req, res) => {
    const yo = await usuarios.buscarPorId(usuarioId(res));
    const c = await comentarios.crear(usuarioId(res), idDeRuta(req, 'id', 'Publicación no encontrada'), req.body?.texto, yo?.nombre ?? 'Alguien');
    res.status(201).json({ comentario: c });
  }));
  router.delete('/:id/comments/:comentarioId', authRequired, manejar(async (req, res) => {
    await comentarios.eliminar(usuarioId(res), idDeRuta(req, 'comentarioId', 'Comentario no encontrado'));
    res.json({ ok: true });
  }));
  return router;
}
