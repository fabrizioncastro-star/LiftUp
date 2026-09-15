import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Database } from '../../../config/Database';
import { Usuario } from '../domain/Usuario';
import { CamposPerfil, IPerfilRepository } from './IPerfilRepository';
import { IUsuarioRepository } from './IUsuarioRepository';

export class UsuarioRepository implements IUsuarioRepository, IPerfilRepository {
  private get pool() { return Database.getInstance().getPool(); }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    return rows[0] ? this.aDominio(rows[0]) : null;
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM usuarios WHERE id = ?', [id]);
    return rows[0] ? this.aDominio(rows[0]) : null;
  }

  async crear(u: Usuario): Promise<Usuario> {
    const [res] = await this.pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
      [u.nombre, u.correo, u.contrasenaHash, u.rol],
    );
    return (await this.buscarPorId(res.insertId)) as Usuario;
  }

  async actualizarPerfil(id: number, c: CamposPerfil): Promise<Usuario> {
    await this.pool.query(
      'UPDATE usuarios SET nombre = ?, nivel_experiencia = ?, biografia = ?, foto_perfil = ? WHERE id = ?',
      [c.nombre, c.nivelExperiencia, c.biografia, c.fotoPerfil, id],
    );
    return (await this.buscarPorId(id)) as Usuario;
  }

  private aDominio(r: RowDataPacket): Usuario {
    return new Usuario({
      id: r.id, nombre: r.nombre, correo: r.correo, contrasenaHash: r.contrasena, rol: r.rol,
      fotoPerfil: r.foto_perfil, nivelExperiencia: r.nivel_experiencia, biografia: r.biografia,
      privacidad: r.privacidad, estado: r.estado, fechaRegistro: r.fecha_registro,
    });
  }
}
