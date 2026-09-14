import mysql, { Pool } from 'mysql2/promise';
import { env } from './env';

export class Database {
  private static instance: Database | null = null;
  private readonly pool: Pool;

  private constructor() {
    this.pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 10000,
    });
  }

  static getInstance(): Database {
    if (!Database.instance) Database.instance = new Database();
    return Database.instance;
  }

  getPool(): Pool {
    return this.pool;
  }
}
