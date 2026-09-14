import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'liftup',
  },
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresDays: Number(process.env.JWT_EXPIRES_DAYS ?? 7),
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(os.homedir(), 'liftup_uploads'),
};
