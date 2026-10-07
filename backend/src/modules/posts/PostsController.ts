import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../../shared/errors/AppError';
import { archivoDe } from '../media/upload';
import { Publicacion } from './domain/Publicacion';
import { FeedService } from './FeedService';
import { PublicacionFacade } from './PublicacionFacade';

function aJson(p: Publicacion) {
  return {
    id: p.id, usuarioId: p.usuarioId, descripcion: p.descripcion, archivoUrl: p.archivoUrl,
    tipoArchivo: p.tipoArchivo, ...p.entrenamiento, fecha: p.fecha,
  };
}

function idDe(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Publicación no encontrada');
  return id;
}

export class PostsController {
  constructor(private readonly facade: PublicacionFacade, private readonly feed: FeedService) {}

  publicar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pub = await this.facade.publicar(res.locals.usuario.id, archivoDe(req), req.body ?? {});
      res.status(201).json({ publicacion: aJson(pub) });
    } catch (err) {
      next(err);
    }
  };

  editar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pub = await this.facade.editar(res.locals.usuario.id, idDe(req), req.body ?? {});
      res.json({ publicacion: aJson(pub) });
    } catch (err) {
      next(err);
    }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.facade.eliminar(res.locals.usuario.id, idDe(req));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };

  verFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.feed.obtener(res.locals.usuario.id, req.query.pagina, req.query.limite));
    } catch (err) {
      next(err);
    }
  };
}
