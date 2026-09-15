import { RequestHandler, Router } from 'express';
import { UsuarioRepository } from '../users/repository/UsuarioRepository';
import { AuthController } from './AuthController';
import { AuthService } from './AuthService';
import { crearAuthRequired } from './authMiddleware';
import { BcryptPasswordHasher } from './infra/BcryptPasswordHasher';
import { JwtTokenService } from './infra/JwtTokenService';
import { SesionRepository } from './infra/SesionRepository';

export interface AuthModulo {
  router: Router;
  authRequired: RequestHandler;
}

export function crearAuthModulo(): AuthModulo {
  const sesiones = new SesionRepository();
  const tokens = new JwtTokenService();
  const service = new AuthService(new UsuarioRepository(), sesiones, new BcryptPasswordHasher(), tokens);
  const controller = new AuthController(service);
  const authRequired = crearAuthRequired(tokens, sesiones);

  const router = Router();
  router.post('/register', controller.registrar);
  router.post('/login', controller.iniciarSesion);
  router.post('/logout', authRequired, controller.cerrarSesion);
  router.get('/me', authRequired, controller.yo);
  return { router, authRequired };
}
