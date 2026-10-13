import { RequestHandler, Router } from 'express';
import { env } from '../../config/env';
import { PublicacionMediaFactory } from '../media/MediaFactory';
import { subirUno } from '../media/upload';
import { FeedRepository } from './infra/FeedRepository';
import { PublicacionRepository } from './infra/PublicacionRepository';
import { FeedService } from './FeedService';
import { PostsController } from './PostsController';
import { PublicacionFacade } from './PublicacionFacade';

/** Composition root del módulo de publicaciones (HU-005) y feed (HU-006). */
export function crearPostsModulo(authRequired: RequestHandler): { postsRouter: Router; feedRouter: Router } {
  const facade = new PublicacionFacade(new PublicacionRepository(), new PublicacionMediaFactory(env.uploadsDir));
  const controller = new PostsController(facade, new FeedService(new FeedRepository()));

  const postsRouter = Router();
  postsRouter.post('/', authRequired, subirUno('archivo'), controller.publicar);
  postsRouter.put('/:id', authRequired, controller.editar);
  postsRouter.delete('/:id', authRequired, controller.eliminar);

  const feedRouter = Router();
  feedRouter.get('/', authRequired, controller.verFeed);
  return { postsRouter, feedRouter };
}
