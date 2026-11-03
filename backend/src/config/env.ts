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
  adminCorreos: (process.env.ADMIN_CORREOS ?? '').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 465),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'LiftUp <no-reply@liftup.app>',
  },
  codigoRecuperacionMinutos: Number(process.env.CODIGO_RECUPERACION_MINUTOS ?? 10),
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(os.homedir(), 'liftup_uploads'),
};
