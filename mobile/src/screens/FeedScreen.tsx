import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, mensajeDeError } from '../api/client';
import { PostCard } from '../components/PostCard';
import { Boton, Encabezado } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { FeedItem } from '../types';

export function FeedScreen() {
  const nav = useNav();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);

  const cargar = useCallback(async (modo: 'inicial' | 'refrescar') => {
    if (modo === 'refrescar') setRefrescando(true);
    setError('');
    try {
      const [feed, cuenta] = await Promise.all([
        api.get('/api/feed', { params: { pagina: 1, limite: 10 }, timeout: 5000 }),
        api.get('/api/notifications/count', { timeout: 5000 }).catch(() => ({ data: { noLeidas: 0 } })),
      ]);
      setItems(feed.data.publicaciones);
      setPagina(1);
      setHayMas(feed.data.hayMas);
      setNoLeidas(cuenta.data.noLeidas);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => { void cargar('inicial'); }, [cargar, nav.version]);

  async function cargarMas() {
    if (!hayMas || cargandoMas) return;
    setCargandoMas(true);
    try {
      const { data } = await api.get('/api/feed', { params: { pagina: pagina + 1, limite: 10 } });
      setItems((prev) => [...prev, ...data.publicaciones.filter((n: FeedItem) => !prev.some((p) => p.id === n.id))]);
      setPagina(pagina + 1);
      setHayMas(data.hayMas);
    } catch {
    } finally {
      setCargandoMas(false);
    }
  }

  return (
    <SafeAreaView style={s.raiz} edges={['top']}>
      <Encabezado
        titulo="LiftUp"
        derecha={(
          <>
            <Pressable onPress={() => nav.push({ n: 'buscar' })} hitSlop={10} accessibilityLabel="Buscar personas"><Text style={s.icono}>🔍</Text></Pressable>
            <Pressable onPress={() => nav.push({ n: 'notificaciones' })} hitSlop={10} accessibilityLabel="Notificaciones">
              <Text style={s.icono}>🔔</Text>
              {noLeidas > 0 ? <View style={s.badge}><Text style={s.badgeTxt}>{noLeidas > 9 ? '9+' : noLeidas}</Text></View> : null}
            </Pressable>
          </>
        )}
      />
      {cargando ? (
        <View style={s.centro}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <PostCard item={item} />}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void cargar('refrescar')} />}
          onEndReached={() => void cargarMas()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={cargandoMas ? <ActivityIndicator style={{ margin: 16 }} /> : undefined}
          contentContainerStyle={items.length === 0 ? { flexGrow: 1 } : { paddingTop: 12 }}
          ListEmptyComponent={
            <View style={s.centro}>
              {error ? (
                <>
                  <Text style={s.error}>{error}</Text>
                  <Boton texto="Reintentar" onPress={() => void cargar('inicial')} />
                </>
              ) : (
                <Text style={s.vacio}>No hay publicaciones aún en la plataforma</Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  vacio: { color: C.suave, fontSize: 16, textAlign: 'center' },
  error: { color: C.peligro, textAlign: 'center', marginBottom: 12 },
  icono: { fontSize: 22 },
  badge: { position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.peligro, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
