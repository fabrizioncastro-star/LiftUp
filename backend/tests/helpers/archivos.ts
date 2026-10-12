import fs from 'fs';
import os from 'os';
import path from 'path';
import { ArchivoSubido } from '../../src/modules/media/tipos';

const relleno = Buffer.alloc(64, 1);

export const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), relleno]);
export const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), relleno]);
export const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), relleno]);
export const MOV = Buffer.concat([Buffer.from([0, 0, 0, 0x14]), Buffer.from('ftypqt  '), relleno]);
export const GIF = Buffer.concat([Buffer.from('GIF89a'), relleno]);
export const PDF = Buffer.concat([Buffer.from('%PDF-1.4'), relleno]);

export function archivo(buffer: Buffer, nombre = 'x.bin', mimetype = 'application/octet-stream'): ArchivoSubido {
  return { buffer, originalname: nombre, mimetype, size: buffer.length };
}

export function carpetaTemporal(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'liftup-test-'));
}

export function archivosEn(dir: string): string[] {
  const salida: string[] = [];
  const recorrer = (d: string) => fs.existsSync(d) && fs.readdirSync(d, { withFileTypes: true }).forEach((e) =>
    e.isDirectory() ? recorrer(path.join(d, e.name)) : salida.push(path.join(d, e.name)));
  recorrer(dir);
  return salida;
}
