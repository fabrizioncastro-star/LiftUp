import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { crearAuthModulo } from './modules/auth';
import { crearPostsModulo } from './modules/posts/posts.routes';
import { crearUsersRouter } from './modules/users/users.routes';
import { errorHandler } from './shared/middlewares/errorHandler';

export function crearApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(env.uploadsDir));

  app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'LiftUp API' }));

  const auth = crearAuthModulo();
  const posts = crearPostsModulo(auth.authRequired);

  app.use('/api/auth', auth.router);
  app.use('/api/users', crearUsersRouter(auth.authRequired));
  app.use('/api/posts', posts.postsRouter);
  app.use('/api/feed', posts.feedRouter);

  app.use(errorHandler);
  return app;
}
