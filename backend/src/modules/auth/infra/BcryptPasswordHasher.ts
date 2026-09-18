import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../domain/IPasswordHasher';

/** OCP/DIP: cambiar de bcrypt a otro algoritmo = nueva clase; AuthService no se toca. */
export class BcryptPasswordHasher implements IPasswordHasher {
  hash(plano: string): Promise<string> { return bcrypt.hash(plano, 10); }
  comparar(plano: string, hash: string): Promise<boolean> { return bcrypt.compare(plano, hash); }
}
