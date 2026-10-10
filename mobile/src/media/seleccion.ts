import * as ImagePicker from 'expo-image-picker';

export interface MedioElegido {
  uri: string;
  tipo: 'imagen' | 'video';
  mimeType: string;
  nombre: string;
}

const IMAGENES = ['image/jpeg', 'image/png'];
const VIDEOS = ['video/mp4', 'video/quicktime'];
const EXTENSIONES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4', mov: 'video/quicktime',
};

/** Valida el formato en el cliente (el backend vuelve a validarlo por la firma real del archivo). */
export function mimeValido(asset: ImagePicker.ImagePickerAsset, soloImagenes: boolean): string | null {
  const ext = (asset.fileName ?? asset.uri).split('.').pop()?.toLowerCase().split('?')[0] ?? '';
  const mime = (asset.mimeType ?? EXTENSIONES[ext] ?? '').toLowerCase();
  const permitidos = soloImagenes ? IMAGENES : [...IMAGENES, ...VIDEOS];
  return permitidos.includes(mime) ? mime : null;
}

export type ResultadoSeleccion = { medio: MedioElegido } | { error: string } | null;

/** Abre la galería. null = el usuario canceló. */
export async function elegirMedio(soloImagenes: boolean, mensajeFormato: string): Promise<ResultadoSeleccion> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: soloImagenes ? ['images'] : ['images', 'videos'],
    quality: 0.8,
  });
  if (r.canceled || r.assets.length === 0) return null;
  const asset = r.assets[0];
  const mime = mimeValido(asset, soloImagenes);
  if (!mime) return { error: mensajeFormato };
  const ext = Object.entries(EXTENSIONES).find(([, m]) => m === mime)?.[0] ?? 'bin';
  return {
    medio: {
      uri: asset.uri,
      tipo: mime.startsWith('video') ? 'video' : 'imagen',
      mimeType: mime,
      nombre: asset.fileName ?? `archivo.${ext}`,
    },
  };
}

/** Parte de un FormData en React Native: { uri, name, type }. */
export function archivoParaForm(m: MedioElegido): Blob {
  return { uri: m.uri, name: m.nombre, type: m.mimeType } as unknown as Blob;
}
