import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { crearAuthModulo } from './modules/auth';
import { crearComunidadesModulo } from './modules/communities';
import { crearInteraccionesRouter } from './modules/interactions';
import { crearModeracionModulo } from './modules/moderation';
import { crearNotificacionesModulo } from './modules/notificaciones';
import { ObservadorPublicacion, crearPostsModulo } from './modules/posts';
import { crearProgresoModulo } from './modules/progreso';
import { crearSocialRouter } from './modules/social';
import { crearUsersRouter } from './modules/users/users.routes';
import { errorHandler } from './shared/middlewares/errorHandler';

export function crearApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(env.uploadsDir));

  app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'LiftUp API' }));

  const auth = crearAuthModulo();
  const notificaciones = crearNotificacionesModulo(auth.authRequired);

  const observadores: ObservadorPublicacion[] = [];
  const posts = crearPostsModulo(auth.authRequired, observadores);
  const progreso = crearProgresoModulo(auth.authRequired, notificaciones.service);
  observadores.push(progreso.alPublicar);

  const comunidades = crearComunidadesModulo(auth.authRequired, posts.feedRepository, posts.facade, notificaciones.service);
  const moderacion = crearModeracionModulo({
    authRequired: auth.authRequired,
    adminRequired: auth.adminRequired,
    publicaciones: posts.publicacionRepository,
    facade: posts.facade,
    cuentas: auth.usuarios,
    sesiones: auth.sesiones,
    solicitudes: comunidades.solicitudes,
    notificador: notificaciones.service,
  });

  app.use('/api/auth', auth.router);
  app.use('/api/notifications', notificaciones.router);
  app.use('/api/users', crearUsersRouter(auth.authRequired));
  app.use('/api/users', crearSocialRouter(auth.authRequired, posts.feedRepository, notificaciones.service));
  app.use('/api/posts', posts.postsRouter);
  app.use('/api/posts', crearInteraccionesRouter(auth.authRequired, posts.publicacionRepository, auth.usuarios, notificaciones.service));
  app.use('/api/feed', posts.feedRouter);
  app.use('/api/progress', progreso.router);
  app.use('/api/communities', comunidades.router);
  app.use('/api', moderacion.reportesRouter);
  app.use('/api/admin', moderacion.adminRouter);

  app.use(errorHandler);
  return app;
}
