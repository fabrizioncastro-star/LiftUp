import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, fechaCorta, mensajeDeError } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Pantalla } from '../components/Pantalla';
import { Encabezado, ErrorTexto, Vacio } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { Comentario, FeedItem } from '../types';

export function ComentariosScreen({ pub, alCambiar }: { pub: FeedItem; alCambiar?: (total: number) => void }) {
  const nav = useNav();
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const [lista, setLista] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/posts/${pub.id}/comments`);
        setLista(data.comentarios);
      } catch (err) {
        setError(mensajeDeError(err));
      } finally {
        setCargando(false);
      }
    })();
  }, [pub.id]);

  function actualizar(nueva: Comentario[]) {
    setLista(nueva);
    alCambiar?.(nueva.length);
  }

  async function enviar() {
    if (!texto.trim()) { setError('El comentario no puede estar vacío'); return; }
    setError('');
    setEnviando(true);
    try {
      const { data } = await api.post(`/api/posts/${pub.id}/comments`, { texto: texto.trim() }, { timeout: 5000 });
      actualizar([...lista, data.comentario]);
      setTexto('');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  function confirmarEliminar(c: Comentario) {
    Alert.alert('Eliminar comentario', '¿Quieres eliminar tu comentario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/posts/${pub.id}/comments/${c.id}`);
            actualizar(lista.filter((x) => x.id !== c.id));
          } catch (err) {
            Alert.alert('No se pudo eliminar', mensajeDeError(err));
          }
        },
      },
    ]);
  }

  const pie = (
    <View style={[s.caja, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <ErrorTexto texto={error} />
      <View style={s.fila}>
        <TextInput
          style={s.input} value={texto} onChangeText={setTexto} placeholder="Escribe un comentario…"
          placeholderTextColor="#9ca3af" multiline maxLength={500}
        />
        <Pressable style={[s.enviar, (enviando || !texto.trim()) && { opacity: 0.5 }]} onPress={enviar} disabled={enviando}>
          {enviando ? <ActivityIndicator color="#fff" /> : <Text style={s.enviarTxt}>Enviar</Text>}
        </Pressable>
      </View>
    </View>
  );

  return (
    <Pantalla scroll={false} pie={pie}>
      <Encabezado titulo="Comentarios" alVolver={nav.pop} />
      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(c) => String(c.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={<Vacio texto="Aún no hay comentarios. ¡Sé la primera persona en comentar!" />}
          renderItem={({ item }) => (
            <View style={s.comentario}>
              <Avatar nombre={item.autor.nombre} foto={item.autor.fotoPerfil} tam={34} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.autor}>{item.autor.nombre} <Text style={s.fecha}>· {fechaCorta(item.fecha)}</Text></Text>
                <Text style={s.texto}>{item.texto}</Text>
              </View>
              {item.autor.id === usuario?.id ? (
                <Pressable onPress={() => confirmarEliminar(item)} hitSlop={10}><Text style={s.borrar}>Eliminar</Text></Pressable>
              ) : null}
            </View>
          )}
        />
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  comentario: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  autor: { fontWeight: '700', color: C.texto },
  fecha: { color: C.suave, fontWeight: '400', fontSize: 12 },
  texto: { color: C.texto, marginTop: 2, lineHeight: 20 },
  borrar: { color: C.peligro, fontSize: 13, fontWeight: '600' },
  caja: { backgroundColor: C.blanco, borderTopWidth: 1, borderTopColor: C.borde, paddingHorizontal: 12, paddingTop: 10 },
  fila: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, maxHeight: 110, minHeight: 40, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 16, color: C.texto, backgroundColor: C.fondo },
  enviar: { backgroundColor: C.primario, borderRadius: 20, paddingHorizontal: 16, height: 40, alignItems: 'center', justifyContent: 'center' },
  enviarTxt: { color: '#fff', fontWeight: '700' },
});
