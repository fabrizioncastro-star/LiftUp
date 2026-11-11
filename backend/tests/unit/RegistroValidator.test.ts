import { RegistroValidator } from '../../src/modules/auth/RegistroValidator';

describe('RegistroValidator', () => {
  const v = new RegistroValidator();
  const base = { nombre: 'Ana', correo: 'ana@correo.com' };

  it.each([
    ['7 caracteres (límite inferior inválido)', '1234567', false],
    ['8 caracteres (límite válido)', '12345678', true],
    ['9 caracteres', '123456789', true],
    ['vacía', '', false],
  ])('contraseña %s', (_d, contrasena, ok) => {
    const act = () => v.validar({ ...base, contrasena });
    ok ? expect(act).not.toThrow() : expect(act).toThrow('al menos 8 caracteres');
  });

  it.each(['a@b', '@b.com', 'a b@c.com', 'abc', ''])('rechaza correo %p', (correo) => {
    expect(() => v.validar({ ...base, correo, contrasena: '12345678' })).toThrow('Formato de correo inválido');
  });

  it('rechaza tipos no string', () => {
    expect(() => v.validar({ nombre: 5, correo: 'a@b.com', contrasena: '12345678' })).toThrow('nombre');
    expect(() => v.validar({ nombre: 'A', correo: null, contrasena: '12345678' })).toThrow('correo');
    expect(() => v.validar({ nombre: 'A', correo: 'a@b.com', contrasena: 12345678 })).toThrow('contraseña');
  });

  it.each(['', '   '])('rechaza nombre vacío %p', (nombre) => {
    expect(() => v.validar({ nombre, correo: 'a@b.com', contrasena: '12345678' })).toThrow('El nombre es obligatorio');
  });

  it('recorta y normaliza nombre y correo', () => {
    expect(v.validar({ nombre: '  Ana ', correo: ' ANA@Correo.COM ', contrasena: '12345678' })).toEqual({
      nombre: 'Ana', correo: 'ana@correo.com', contrasena: '12345678',
    });
  });
});
