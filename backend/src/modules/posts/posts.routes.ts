import { RequestHandler, Router } from 'express';
import { env } from '../../config/env';
import { PublicacionMediaFactory } from '../media/MediaFactory';
import { subirUno } from '../media/upload';
import { IFeedRepository } from './domain/IFeedRepository';
import { IPublicacionRepository } from './domain/IPublicacionRepository';
import { FeedRepository } from './infra/FeedRepository';
import { PublicacionRepository } from './infra/PublicacionRepository';
import { FeedService } from './FeedService';
import { PostsController } from './PostsController';
import { ObservadorPublicacion, PublicacionFacade } from './PublicacionFacade';

export interface PostsModulo {
  postsRouter: Router;
  feedRouter: Router;
  facade: PublicacionFacade;
  feedRepository: IFeedRepository;
  publicacionRepository: IPublicacionRepository;
}

export function crearPostsModulo(authRequired: RequestHandler, observadores: ObservadorPublicacion[]): PostsModulo {
  const publicacionRepository = new PublicacionRepository();
  const feedRepository = new FeedRepository();
  const facade = new PublicacionFacade(publicacionRepository, new PublicacionMediaFactory(env.uploadsDir), observadores);
  const controller = new PostsController(facade, new FeedService(feedRepository));

  const postsRouter = Router();
  postsRouter.post('/', authRequired, subirUno('archivo'), controller.publicar);
  postsRouter.put('/:id', authRequired, controller.editar);
  postsRouter.delete('/:id', authRequired, controller.eliminar);

  const feedRouter = Router();
  feedRouter.get('/', authRequired, controller.verFeed);
  return { postsRouter, feedRouter, facade, feedRepository, publicacionRepository };
}
