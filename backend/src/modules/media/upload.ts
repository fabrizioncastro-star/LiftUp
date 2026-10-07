import { Request } from 'express';
import multer from 'multer';
import { ArchivoSubido } from './tipos';

// Multer solo recibe el multipart y lo deja en memoria; validar/guardar es trabajo del dominio.
const multerMemoria = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

export const subirUno = (campo: string) => multerMemoria.single(campo);

/** Convierte el archivo de Multer en el tipo propio (el dominio no depende de Multer). */
export function archivoDe(req: Request): ArchivoSubido | undefined {
  const f = req.file;
  return f ? { buffer: f.buffer, mimetype: f.mimetype, originalname: f.originalname, size: f.size } : undefined;
}
