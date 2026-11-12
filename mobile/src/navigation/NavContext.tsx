import React, { createContext, useContext } from 'react';
import { Comunidad, FeedItem } from '../types';

export type Ruta =
  | { n: 'comentarios'; pub: FeedItem; alCambiar?: (total: number) => void }
  | { n: 'usuario'; id: number }
  | { n: 'editarPublicacion'; pub: FeedItem }
  | { n: 'editarPerfil' }
  | { n: 'notificaciones' }
  | { n: 'buscar' }
  | { n: 'solicitudesSeguimiento' }
  | { n: 'privacidad' }
  | { n: 'comunidad'; c: Comunidad }
  | { n: 'nuevaComunidad' }
  | { n: 'nuevaSesion'; comunidadId?: number; comunidadNombre?: string }
  | { n: 'admin' };

interface Nav {
  push(r: Ruta): void;
  pop(): void;
  refrescar(): void;
  version: number;
}

export const NavContext = createContext<Nav | null>(null);

export function useNav(): Nav {
  const n = useContext(NavContext);
  if (!n) throw new Error('useNav debe usarse dentro de HomeScreen');
  return n;
}
