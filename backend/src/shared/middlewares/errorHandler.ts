import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../errors/AppError';

// Manejo de errores centralizado: ningún controller arma respuestas de error por su cuenta.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooBig ? 413 : 422).json({ error: tooBig ? 'El archivo es demasiado grande' : 'Archivo inválido' });
    return;
  }
  console.error('[LiftUp] Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
