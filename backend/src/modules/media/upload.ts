import { Request } from 'express';
import multer from 'multer';
import { ArchivoSubido } from './tipos';

const multerMemoria = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

export const subirUno = (campo: string) => multerMemoria.single(campo);

export function archivoDe(req: Request): ArchivoSubido | undefined {
  const f = req.file;
  return f ? { buffer: f.buffer, mimetype: f.mimetype, originalname: f.originalname, size: f.size } : undefined;
}
