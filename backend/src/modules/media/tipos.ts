/** Archivo recibido por HTTP (multipart), ya en memoria. Independiente de Multer. */
export interface ArchivoSubido {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/** Tipo real del archivo, detectado por su firma (no por la extensión que declara el cliente). */
export type TipoDetectado = 'jpg' | 'png' | 'mp4' | 'mov';

export function detectarTipo(buffer: Buffer): TipoDetectado | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    // 'qt  ' = QuickTime (.mov de iPhone); el resto de marcas (isom, mp42, avc1...) son MP4.
    return buffer.toString('ascii', 8, 12) === 'qt  ' ? 'mov' : 'mp4';
  }
  return null;
}

export const esVideo = (t: TipoDetectado): boolean => t === 'mp4' || t === 'mov';
