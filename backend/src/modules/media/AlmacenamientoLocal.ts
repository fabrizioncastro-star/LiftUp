import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { IAlmacenamiento } from './IAlmacenamiento';
import { ArchivoSubido, detectarTipo } from './tipos';

/**
 * Patrón ADAPTER: adapta el sistema de archivos a la interfaz IAlmacenamiento.
 * Cambiar a un CDN = otra clase que implemente IAlmacenamiento; nadie más se entera.
 */
export class AlmacenamientoLocal implements IAlmacenamiento {
  constructor(private readonly baseDir: string, private readonly subcarpeta: string) {}

  async guardar(archivo: ArchivoSubido): Promise<string> {
    const ext = detectarTipo(archivo.buffer) ?? 'bin';
    const nombre = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const dir = path.join(this.baseDir, this.subcarpeta);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, nombre), archivo.buffer);
    return `/uploads/${this.subcarpeta}/${nombre}`;
  }

  async eliminar(url: string): Promise<void> {
    const prefijo = `/uploads/${this.subcarpeta}/`;
    if (!url.startsWith(prefijo)) return; // nunca borra fuera de su carpeta
    await fs.unlink(path.join(this.baseDir, this.subcarpeta, path.basename(url))).catch(() => undefined);
  }
}
