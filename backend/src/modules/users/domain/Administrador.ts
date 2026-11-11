import { Usuario } from './Usuario';

export class Administrador extends Usuario {
  puedeModerar(): boolean {
    return true;
  }
}
