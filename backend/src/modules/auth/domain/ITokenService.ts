export interface TokenPayload {
  id: number;
  correo: string;
  rol: string;
}

export interface ITokenService {
  firmar(payload: TokenPayload): string;
  /** Devuelve el payload si el token es válido y no expiró; lanza error si no. */
  verificar(token: string): TokenPayload;
  /** Fecha en la que expira el token emitido (se guarda en `sesiones`). */
  calcularExpiracion(): Date;
}
