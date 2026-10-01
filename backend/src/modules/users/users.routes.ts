import { RequestHandler, Router } from 'express';
import { env } from '../../config/env';
import { PerfilMediaFactory } from '../media/MediaFactory';
import { subirUno } from '../media/upload';
import { PerfilController } from './PerfilController';
import { PerfilService } from './PerfilService';
import { UsuarioRepository } from './repository/UsuarioRepository';

export function crearUsersRouter(authRequired: RequestHandler): Router {
  const service = new PerfilService(new UsuarioRepository(), new PerfilMediaFactory(env.uploadsDir));
  const controller = new PerfilController(service);
  const router = Router();
  router.put('/profile', authRequired, subirUno('foto'), controller.editar);
  return router;
}
