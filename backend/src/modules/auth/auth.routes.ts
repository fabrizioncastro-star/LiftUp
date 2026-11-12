import { RequestHandler, Router } from 'express';
import { manejar } from '../../shared/http';
import { UsuarioRepository } from '../users/repository/UsuarioRepository';
import { AuthController } from './AuthController';
import { AuthService } from './AuthService';
import { crearAdminRequired, crearAuthRequired } from './authMiddleware';
import { BcryptPasswordHasher } from './infra/BcryptPasswordHasher';
import { CodigoRecuperacionRepository } from './infra/CodigoRecuperacionRepository';
import { crearEnviadorCorreo } from './infra/CorreoAdapters';
import { JwtTokenService } from './infra/JwtTokenService';
import { SesionRepository } from './infra/SesionRepository';
import { env } from '../../config/env';
import { RecuperacionService } from './recuperacion';

export interface AuthModulo {
  router: Router;
  authRequired: RequestHandler;
  adminRequired: RequestHandler;
  usuarios: UsuarioRepository;
  sesiones: SesionRepository;
}

export function crearAuthModulo(): AuthModulo {
  const sesiones = new SesionRepository();
  const tokens = new JwtTokenService();
  const usuarios = new UsuarioRepository();
  const hasher = new BcryptPasswordHasher();
  const service = new AuthService(usuarios, sesiones, hasher, tokens);
  const recuperacion = new RecuperacionService(
    usuarios, new CodigoRecuperacionRepository(), hasher, crearEnviadorCorreo(), sesiones, env.codigoRecuperacionMinutos,
  );
  const controller = new AuthController(service);
  const authRequired = crearAuthRequired(tokens, sesiones);
  const adminRequired = crearAdminRequired(usuarios);

  const router = Router();
  router.post('/register', controller.registrar);
  router.post('/login', controller.iniciarSesion);
  router.post('/logout', authRequired, controller.cerrarSesion);
  router.get('/me', authRequired, controller.yo);

  router.post('/forgot-password', manejar(async (req, res) => {
    await recuperacion.solicitarCodigo(req.body?.correo);
    res.json({ ok: true });
  }));
  router.post('/verify-code', manejar(async (req, res) => {
    await recuperacion.verificarCodigo(req.body?.correo, req.body?.codigo);
    res.json({ ok: true });
  }));
  router.post('/reset-password', manejar(async (req, res) => {
    await recuperacion.restablecer(req.body?.correo, req.body?.codigo, req.body?.nuevaContrasena);
    res.json({ ok: true });
  }));
  return { router, authRequired, adminRequired, usuarios, sesiones };
}
