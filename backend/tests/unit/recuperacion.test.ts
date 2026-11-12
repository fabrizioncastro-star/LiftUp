import { CodigoRecuperacion, ICodigoRecuperacionRepository, IEnviadorCorreo, RecuperacionService } from '../../src/modules/auth/recuperacion';
import { crearServicio, hasherFalso } from '../helpers/fakes';

class CodigosRepo implements ICodigoRecuperacionRepository {
  fila: (CodigoRecuperacion & { usado: boolean }) | null = null;
  private n = 0;
  constructor(private reloj: () => Date) {}
  async reemplazar(_u: number, hash: string, expira: Date) { this.fila = { id: ++this.n, codigoHash: hash, expira, intentos: 0, creado: this.reloj(), usado: false }; }
  async vigente() { return this.fila && !this.fila.usado ? this.fila : null; }
  async registrarIntentoFallido() { if (this.fila) this.fila.intentos++; }
  async marcarUsado() { if (this.fila) this.fila.usado = true; }
  async eliminar() { this.fila = null; }
}

function montar(opciones: { fallaCorreo?: boolean } = {}) {
  let ahora = new Date('2026-10-20T12:00:00Z');
  const base = crearServicio();
  base.usuarios.sembrar('ana@correo.com', 'clave1234');
  const codigos = new CodigosRepo(() => ahora);
  const enviados: { para: string; texto: string }[] = [];
  const correo: IEnviadorCorreo = {
    enviar: async (para, _asunto, texto) => { if (opciones.fallaCorreo) throw new Error('SMTP caído'); enviados.push({ para, texto }); },
  };
  const s = new RecuperacionService(base.usuarios, codigos, hasherFalso, correo, base.sesiones, 10, () => ahora, () => '123456');
  return { ...base, codigos, enviados, s, avanzar: (ms: number) => { ahora = new Date(ahora.getTime() + ms); } };
}

describe('RecuperacionService (HU-016)', () => {
  it('Esc. 1: envía el código al correo registrado (guardado solo como hash)', async () => {
    const { s, enviados, codigos } = montar();
    await s.solicitarCodigo(' ANA@correo.com ');
    expect(enviados).toHaveLength(1);
    expect(enviados[0]).toMatchObject({ para: 'ana@correo.com' });
    expect(enviados[0].texto).toContain('123456');
    expect(codigos.fila?.codigoHash).toBe('hash(123456)');
    expect(codigos.fila?.codigoHash).not.toBe('123456');
  });

  it('Esc. 2: correo no registrado -> 404 "Este correo no está registrado" y no envía nada', async () => {
    const { s, enviados } = montar();
    await expect(s.solicitarCodigo('nadie@correo.com')).rejects.toMatchObject({ status: 404, message: 'Este correo no está registrado' });
    expect(enviados).toHaveLength(0);
  });

  it('correo con formato inválido -> 422', async () => {
    await expect(montar().s.solicitarCodigo('sin-arroba')).rejects.toMatchObject({ status: 422 });
  });

  it('pedir otro código antes de 30 s -> 429; pasado ese tiempo se permite y reemplaza al anterior', async () => {
    const { s, avanzar, enviados } = montar();
    await s.solicitarCodigo('ana@correo.com');
    await expect(s.solicitarCodigo('ana@correo.com')).rejects.toMatchObject({ status: 429 });
    avanzar(31_000);
    await s.solicitarCodigo('ana@correo.com');
    expect(enviados).toHaveLength(2);
  });

  it('si falla el envío se descarta el código y se responde 502', async () => {
    const { s, codigos } = montar({ fallaCorreo: true });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(s.solicitarCodigo('ana@correo.com')).rejects.toMatchObject({ status: 502 });
    expect(codigos.fila).toBeNull();
    spy.mockRestore();
  });

  it('Esc. 3: código incorrecto -> "Código inválido o expirado"', async () => {
    const { s } = montar();
    await s.solicitarCodigo('ana@correo.com');
    await expect(s.verificarCodigo('ana@correo.com', '000000')).rejects.toMatchObject({ status: 422, message: 'Código inválido o expirado' });
  });

  it('Esc. 3: código vencido (más de 10 minutos) -> "Código inválido o expirado"', async () => {
    const { s, avanzar } = montar();
    await s.solicitarCodigo('ana@correo.com');
    avanzar(10 * 60_000 + 1);
    await expect(s.verificarCodigo('ana@correo.com', '123456')).rejects.toMatchObject({ message: 'Código inválido o expirado' });
  });

  it('tras 5 intentos fallidos el código se bloquea aunque luego se escriba el correcto', async () => {
    const { s } = montar();
    await s.solicitarCodigo('ana@correo.com');
    for (let i = 0; i < 5; i++) await expect(s.verificarCodigo('ana@correo.com', '999999')).rejects.toBeDefined();
    await expect(s.verificarCodigo('ana@correo.com', '123456')).rejects.toMatchObject({ message: 'Código inválido o expirado' });
  });

  it('el código correcto se verifica sin consumirlo', async () => {
    const { s } = montar();
    await s.solicitarCodigo('ana@correo.com');
    await expect(s.verificarCodigo('ana@correo.com', '123456')).resolves.toBeUndefined();
    await expect(s.verificarCodigo('ana@correo.com', '123456')).resolves.toBeUndefined();
  });

  it('Esc. 4: con el código correcto cambia la contraseña, cierra todas las sesiones y consume el código', async () => {
    const { s, usuarios, sesiones, codigos } = montar();
    sesiones.sesiones.push({ usuarioId: 1, token: 't1', fechaExpiracion: new Date() });
    await s.solicitarCodigo('ana@correo.com');
    await s.restablecer('ana@correo.com', '123456', 'nuevaClave99');
    expect((await usuarios.buscarPorCorreo('ana@correo.com'))?.contrasenaHash).toBe('hash(nuevaClave99)');
    expect(sesiones.sesiones).toHaveLength(0);
    expect(codigos.fila?.usado).toBe(true);
    await expect(s.restablecer('ana@correo.com', '123456', 'otraClave99')).rejects.toMatchObject({ message: 'Código inválido o expirado' });
  });

  it.each([['7 caracteres', '1234567'], ['vacía', ''], ['no es texto', 12345678]])(
    'Esc. 5: nueva contraseña %s -> "La contraseña debe tener al menos 8 caracteres" y no cambia nada', async (_n, nueva) => {
      const { s, usuarios } = montar();
      await s.solicitarCodigo('ana@correo.com');
      await expect(s.restablecer('ana@correo.com', '123456', nueva)).rejects.toMatchObject({ status: 422, message: 'La contraseña debe tener al menos 8 caracteres' });
      expect((await usuarios.buscarPorCorreo('ana@correo.com'))?.contrasenaHash).toBe('hash(clave1234)');
    },
  );

  it('sin haber pedido código, verificar o restablecer falla con el mismo mensaje', async () => {
    const { s } = montar();
    await expect(s.verificarCodigo('ana@correo.com', '123456')).rejects.toMatchObject({ message: 'Código inválido o expirado' });
    await expect(s.restablecer('nadie@x.com', '123456', 'nuevaClave99')).rejects.toMatchObject({ message: 'Código inválido o expirado' });
  });
});
