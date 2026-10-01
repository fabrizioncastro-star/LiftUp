import { NextFunction, Request, Response } from 'express';
import { archivoDe } from '../media/upload';
import { PerfilService } from './PerfilService';

/** SRP: solo traduce HTTP (multipart) <-> PerfilService. */
export class PerfilController {
  constructor(private readonly service: PerfilService) {}

  editar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const b = req.body ?? {};
      const usuario = await this.service.editarPerfil(
        res.locals.usuario.id,
        { nombre: b.nombre, nivelExperiencia: b.nivelExperiencia, biografia: b.biografia },
        archivoDe(req),
      );
      res.json({ usuario });
    } catch (err) {
      next(err);
    }
  };
}
