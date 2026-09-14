import fs from 'fs';
import path from 'path';
import { RowDataPacket } from 'mysql2/promise';
import { Database } from './Database';

// Tablas de un esquema anterior (proyecto de Ingeniería de Software I). Si existen con el esquema viejo
// se renombran a legacy_*, sin borrar datos, para que el esquema nuevo pueda crearse limpio.
const TABLAS_ANTERIORES = [
  'reportes', 'solicitudes_comunidad', 'miembros_comunidad', 'comunidades', 'seguimientos',
  'logros', 'records', 'comentarios', 'reacciones', 'publicaciones', 'sesiones', 'usuarios',
];

/** Aplica db/schema.sql al arrancar (idempotente: solo CREATE TABLE IF NOT EXISTS). */
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
    const aRenombrar = TABLAS_ANTERIORES.filter((t) => nombres.has(t));
    if (aRenombrar.length > 0) {
      await pool.query(`RENAME TABLE ${aRenombrar.map((t) => `\`${t}\` TO \`legacy_${t}\``).join(', ')}`);
      console.log(`[migrar] Tablas del esquema anterior respaldadas como legacy_*: ${aRenombrar.join(', ')}`);
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
  console.log(`[migrar] Esquema verificado (${sentencias.length} sentencias).`);
}
