import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Pantalla } from '../components/Pantalla';
import { PostCard } from '../components/PostCard';
import { Boton, Encabezado, ErrorTexto, Vacio } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { Comunidad, FeedItem } from '../types';

export function ComunidadScreen({ comunidad }: { comunidad: Comunidad }) {
  const nav = useNav();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get(`/api/communities/${comunidad.id}/feed`, { params: { pagina: 1 }, timeout: 5000 });
      setItems(data.publicaciones);
      setPagina(1);
      setHayMas(data.hayMas);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [comunidad.id]);

  useEffect(() => { void cargar(); }, [cargar, nav.version]);

  async function cargarMas() {
    if (!hayMas) return;
    try {
      const { data } = await api.get(`/api/communities/${comunidad.id}/feed`, { params: { pagina: pagina + 1 } });
      setItems((prev) => [...prev, ...data.publicaciones.filter((n: FeedItem) => !prev.some((p) => p.id === n.id))]);
      setPagina(pagina + 1);
      setHayMas(data.hayMas);
    } catch {
    }
  }

  const cabecera = (
    <View style={s.cabecera}>
      <Text style={s.meta}>{comunidad.tipo} · {comunidad.miembros} {comunidad.miembros === 1 ? 'miembro' : 'miembros'}</Text>
      {comunidad.descripcion ? <Text style={s.desc}>{comunidad.descripcion}</Text> : null}
      <Boton texto="Publicar en esta comunidad" onPress={() => nav.push({ n: 'nuevaSesion', comunidadId: comunidad.id, comunidadNombre: comunidad.nombre })} />
    </View>
  );

  return (
    <Pantalla scroll={false}>
      <Encabezado titulo={comunidad.nombre} alVolver={nav.pop} />
      {cargando ? <ActivityIndicator style={{ marginTop: 40 }} /> : error ? (
        <View style={{ padding: 20 }}><ErrorTexto texto={error} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <PostCard item={item} />}
          ListHeaderComponent={cabecera}
          ListEmptyComponent={<Vacio texto="Aún no hay publicaciones en esta comunidad. ¡Publica la primera!" />}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); void cargar(); }} />}
          onEndReached={() => void cargarMas()}
          onEndReachedThreshold={0.5}
        />
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  cabecera: { backgroundColor: C.blanco, padding: 16, marginBottom: 12, gap: 10 },
  meta: { color: C.suave },
  desc: { color: '#374151', lineHeight: 20 },
});
