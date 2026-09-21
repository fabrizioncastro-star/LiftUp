import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { ITokenService, TokenPayload } from '../domain/ITokenService';

export class JwtTokenService implements ITokenService {
  firmar(payload: TokenPayload): string {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: `${env.jwtExpiresDays}d` });
  }

  verificar(token: string): TokenPayload {
    const { id, correo, rol } = jwt.verify(token, env.jwtSecret) as TokenPayload;
    return { id, correo, rol };
  }

  calcularExpiracion(): Date {
    return new Date(Date.now() + env.jwtExpiresDays * 24 * 60 * 60 * 1000);
  }
}
