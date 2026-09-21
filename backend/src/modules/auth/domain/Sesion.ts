/** Clase de dominio Sesion (diagrama: crear(), invalidar()). Pertenece a 1 usuario. */
export class Sesion {
  constructor(
    public readonly usuarioId: number,
    public readonly token: string,
    public readonly fechaExpiracion: Date,
    public readonly id?: number,
  ) {}
}
