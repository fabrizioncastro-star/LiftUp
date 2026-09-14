import React, { createContext, useContext } from 'react';
import { FeedItem } from '../types';

export type Ruta =
  | { n: 'editarPublicacion'; pub: FeedItem }
  | { n: 'editarPerfil' };

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
