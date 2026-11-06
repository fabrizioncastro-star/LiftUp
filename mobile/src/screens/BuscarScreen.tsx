import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Pantalla } from '../components/Pantalla';
import { Encabezado, ErrorTexto, Vacio } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { NIVELES, UsuarioBasico } from '../types';

export function BuscarScreen() {
  const nav = useNav();
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<UsuarioBasico[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (q.trim().length < 2) { setResultados([]); setError(''); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const { data } = await api.get('/api/users/search', { params: { q: q.trim() }, timeout: 5000 });
        setResultados(data.usuarios);
        setError('');
      } catch (err) {
        setError(mensajeDeError(err));
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Pantalla scroll={false}>
      <Encabezado titulo="Buscar personas" alVolver={nav.pop} />
      <View style={s.caja}>
        <TextInput
          style={s.input} value={q} onChangeText={setQ} placeholder="Escribe un nombre…" placeholderTextColor="#9ca3af"
          autoFocus autoCapitalize="none" returnKeyType="search"
        />
      </View>
      {buscando ? <ActivityIndicator style={{ marginTop: 20 }} /> : null}
      <ErrorTexto texto={error} />
      <FlatList
        data={resultados}
        keyExtractor={(u) => String(u.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={q.trim().length >= 2 && !buscando && !error ? <Vacio texto="No encontramos a nadie con ese nombre." /> : <Vacio texto="Escribe al menos 2 letras para buscar." />}
        renderItem={({ item }) => (
          <Pressable style={s.fila} onPress={() => nav.push({ n: 'usuario', id: item.id })}>
            <Avatar nombre={item.nombre} foto={item.fotoPerfil} tam={44} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={s.nombre}>{item.nombre}</Text>
              <Text style={s.nivel}>{NIVELES.find((n) => n.valor === item.nivelExperiencia)?.etiqueta}</Text>
            </View>
            <Text style={s.flecha}>›</Text>
          </Pressable>
        )}
      />
    </Pantalla>
  );
}

const s = StyleSheet.create({
  caja: { padding: 12, backgroundColor: C.blanco },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 16, color: C.texto, backgroundColor: C.fondo },
  fila: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: C.blanco, borderBottomWidth: 1, borderBottomColor: C.borde },
  nombre: { fontWeight: '700', color: C.texto, fontSize: 16 },
  nivel: { color: C.suave, fontSize: 13 },
  flecha: { color: C.suave, fontSize: 24 },
});
