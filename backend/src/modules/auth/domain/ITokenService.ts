export interface TokenPayload {
  id: number;
  correo: string;
  rol: string;
}

export interface ITokenService {
  firmar(payload: TokenPayload): string;
  verificar(token: string): TokenPayload;
  calcularExpiracion(): Date;
}
