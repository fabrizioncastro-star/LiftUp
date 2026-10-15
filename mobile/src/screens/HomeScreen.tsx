import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavContext, Ruta } from '../navigation/NavContext';
import { C } from '../theme';
import { EditarPerfilScreen } from './EditarPerfilScreen';
import { EditarPublicacionScreen } from './EditarPublicacionScreen';
import { FeedScreen } from './FeedScreen';
import { NuevaSesionScreen } from './NuevaSesionScreen';
import { PerfilScreen } from './PerfilScreen';

type Pestana = 'inicio' | 'nueva' | 'perfil';

const PESTANAS: { clave: Pestana; icono: string; etiqueta: string }[] = [
  { clave: 'inicio', icono: '🏠', etiqueta: 'Inicio' },
  { clave: 'nueva', icono: '➕', etiqueta: 'Publicar' },
  { clave: 'perfil', icono: '👤', etiqueta: 'Perfil' },
];

/** Pantalla principal: barra inferior de pestañas y una pila de pantallas que se abren encima. */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [pestana, setPestana] = useState<Pestana>('inicio');
  const [pila, setPila] = useState<Ruta[]>([]);
  const [version, setVersion] = useState(0); // al cambiar, el feed se recarga

  const nav = useMemo(() => ({
    push: (r: Ruta) => setPila((p) => [...p, r]),
    pop: () => setPila((p) => p.slice(0, -1)),
    refrescar: () => setVersion((v) => v + 1),
    version,
  }), [version]);

  // Botón "atrás" de Android: cierra la pantalla de encima antes de salir
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pila.length > 0) { setPila((p) => p.slice(0, -1)); return true; }
      if (pestana !== 'inicio') { setPestana('inicio'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [pila.length, pestana]);

  const alPublicar = () => { setVersion((v) => v + 1); setPestana('inicio'); setPila([]); };
  const cima = pila[pila.length - 1];

  function pantallaDe(r: Ruta): React.ReactNode {
    switch (r.n) {
      case 'editarPublicacion': return <EditarPublicacionScreen publicacion={r.pub} />;
      case 'editarPerfil': return <EditarPerfilScreen />;
    }
  }

  return (
    <NavContext.Provider value={nav}>
      <View style={s.raiz}>
        <View style={s.contenido}>
          {/* Las pestañas siguen montadas debajo para conservar su estado; la pila se dibuja encima */}
          <View style={[s.capa, pila.length > 0 && s.oculta]}>
            {pestana === 'inicio' && <FeedScreen />}
            {pestana === 'nueva' && <NuevaSesionScreen alPublicar={alPublicar} />}
            {pestana === 'perfil' && <PerfilScreen />}
          </View>
          {cima ? <View style={[s.capa, s.encima]} key={pila.length}>{pantallaDe(cima)}</View> : null}
        </View>

        <View style={[s.barra, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {PESTANAS.map((p) => (
            <Pressable key={p.clave} style={s.tab} onPress={() => { setPila([]); setPestana(p.clave); }} accessibilityRole="tab" accessibilityLabel={p.etiqueta}>
              <Text style={[s.icono, pestana === p.clave && pila.length === 0 && s.iconoActivo]}>{p.icono}</Text>
              <Text style={[s.tabTxt, pestana === p.clave && pila.length === 0 && s.activa]}>{p.etiqueta}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </NavContext.Provider>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fondo },
  contenido: { flex: 1 },
  capa: { flex: 1 },
  oculta: { display: 'none' },
  encima: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.fondo },
  barra: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.borde, backgroundColor: C.blanco, paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  icono: { fontSize: 20, opacity: 0.55 },
  iconoActivo: { opacity: 1 },
  tabTxt: { fontSize: 11, color: C.suave, fontWeight: '600' },
  activa: { color: C.primario },
});
