import { crearServicio } from '../helpers/fakes';

describe('AuthService.registrar (HU-001)', () => {
  const valido = { nombre: 'Ana Pérez', correo: 'Ana@Correo.com', contrasena: 'clave1234' };

  it('Escenario 1: registra, guarda el hash (no la clave) y abre sesión', async () => {
    const { service, usuarios, sesiones } = crearServicio();
    const r = await service.registrar(valido);
    expect(r.token).toBe('token-1');
    expect(r.usuario.correo).toBe('ana@correo.com');
    expect(usuarios.guardados[0].contrasenaHash).toBe('hash(clave1234)');
    expect(JSON.stringify(r)).not.toContain('hash(');
    expect(sesiones.sesiones).toHaveLength(1);
  });

  it('Escenario 2: correo ya registrado -> 409 y no crea la cuenta', async () => {
    const { service, usuarios } = crearServicio();
    await service.registrar(valido);
    await expect(service.registrar({ ...valido, correo: 'ana@correo.com' })).rejects.toMatchObject({
      message: 'Este correo ya está registrado', status: 409,
    });
    expect(usuarios.guardados).toHaveLength(1);
  });

  it('Escenario 3: contraseña de 7 caracteres -> 422', async () => {
    const { service, usuarios } = crearServicio();
    await expect(service.registrar({ ...valido, contrasena: '1234567' })).rejects.toMatchObject({
      message: 'La contraseña debe tener al menos 8 caracteres', status: 422,
    });
    expect(usuarios.guardados).toHaveLength(0);
  });

  it('Escenario 4: formato de correo inválido -> 422', async () => {
    const { service } = crearServicio();
    await expect(service.registrar({ ...valido, correo: 'sin-arroba' })).rejects.toMatchObject({
      message: 'Formato de correo inválido', status: 422,
    });
  });

  it('nombre vacío -> 422', async () => {
    const { service } = crearServicio();
    await expect(service.registrar({ ...valido, nombre: '   ' })).rejects.toMatchObject({ status: 422 });
  });
});
