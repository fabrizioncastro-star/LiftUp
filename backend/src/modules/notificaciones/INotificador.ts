export interface INotificador {
  notificar(usuarioId: number, tipo: string, mensaje: string): Promise<void>;
}
