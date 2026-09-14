import React, { createContext, useContext } from 'react';
import { FeedItem } from '../types';

/** Pantallas que se abren encima de las pestañas (pila simple de navegación, sin librerías externas). */
export type Ruta =
  | { n: 'editarPublicacion'; pub: FeedItem }
  | { n: 'editarPerfil' };

interface Nav {
  push(r: Ruta): void;
  pop(): void;
  /** Pide a las pantallas con listas (feed) que se recarguen. */
  refrescar(): void;
  version: number;
}

export const NavContext = createContext<Nav | null>(null);

export function useNav(): Nav {
  const n = useContext(NavContext);
  if (!n) throw new Error('useNav debe usarse dentro de HomeScreen');
  return n;
}
