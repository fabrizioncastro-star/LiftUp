import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { crearAuthModulo } from './modules/auth';
import { crearPostsModulo } from './modules/posts/posts.routes';
import { crearUsersRouter } from './modules/users/users.routes';
import { errorHandler } from './shared/middlewares/errorHandler';

/**
 * Composition root de la aplicación: crea cada módulo y los conecta solo por sus interfaces.
 * Los módulos no se conocen entre sí; aquí se les pasan las dependencias (inyección).
 */
export function crearApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(env.uploadsDir)); // fotos y videos subidos

  app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'LiftUp API' }));

  const auth = crearAuthModulo();
  const posts = crearPostsModulo(auth.authRequired);

  app.use('/api/auth', auth.router); // HU-001, HU-002, HU-003
  app.use('/api/users', crearUsersRouter(auth.authRequired)); // HU-004
  app.use('/api/posts', posts.postsRouter); // HU-005
  app.use('/api/feed', posts.feedRouter); // HU-006

  app.use(errorHandler);
  return app;
}
