import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../domain/IPasswordHasher';

export class BcryptPasswordHasher implements IPasswordHasher {
  hash(plano: string): Promise<string> { return bcrypt.hash(plano, 10); }
  comparar(plano: string, hash: string): Promise<boolean> { return bcrypt.compare(plano, hash); }
}
