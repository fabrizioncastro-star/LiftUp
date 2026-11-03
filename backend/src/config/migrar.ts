import fs from 'fs';
import path from 'path';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { Database } from './Database';
import { env } from './env';

const TABLAS_MVP = [
  'reportes', 'solicitudes_comunidad', 'miembros_comunidad', 'comunidades', 'seguimientos',
  'logros', 'records', 'comentarios', 'reacciones', 'publicaciones', 'sesiones', 'usuarios',
];

export async function migrar(): Promise<void> {
  const pool = Database.getInstance().getPool();

  const [cols] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_TYPE AS tipo FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'privacidad'`,
  );
  if (cols[0] && String(cols[0].tipo).includes("'publico'")) {
    const [existentes] = await pool.query<RowDataPacket[]>(
      'SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()',
    );
    const nombres = new Set(existentes.map((r) => String(r.t)));
    const aRenombrar = TABLAS_MVP.filter((t) => nombres.has(t));
    if (aRenombrar.length > 0) {
      await pool.query(`RENAME TABLE ${aRenombrar.map((t) => `\`${t}\` TO \`legacy_${t}\``).join(', ')}`);
      console.log(`[migrar] Tablas del MVP anterior respaldadas como legacy_*: ${aRenombrar.join(', ')}`);
    }
  }

  const sql = fs.readFileSync(path.resolve(__dirname, '..', '..', 'db', 'schema.sql'), 'utf8');
  const sentencias = sql
    .split('\n')
    .map((l) => l.replace(/--.*$/, ''))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const s of sentencias) await pool.query(s);

  if (!(await existeColumna(pool, 'publicaciones', 'comunidad_id'))) {
    await pool.query('ALTER TABLE publicaciones ADD COLUMN comunidad_id INT NULL AFTER usuario_id');
    await pool.query('ALTER TABLE publicaciones ADD INDEX idx_publicaciones_comunidad (comunidad_id)');
    await pool.query(
      `ALTER TABLE publicaciones ADD CONSTRAINT fk_liftup_publicaciones_comunidad
       FOREIGN KEY (comunidad_id) REFERENCES comunidades(id) ON DELETE CASCADE`,
    );
  }

  if (env.adminCorreos.length > 0) {
    await pool.query("UPDATE usuarios SET rol = 'admin' WHERE correo IN (?)", [env.adminCorreos]);
  }
  console.log(`[migrar] Esquema verificado (${sentencias.length} sentencias).`);
}

async function existeColumna(pool: Pool, tabla: string, columna: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 AS x FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [tabla, columna],
  );
  return rows.length > 0;
}
