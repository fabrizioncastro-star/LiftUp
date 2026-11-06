import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Pantalla } from '../components/Pantalla';
import { Boton, Encabezado, ErrorTexto, Vacio } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';

interface Solicitud { id: number; seguidor: { id: number; nombre: string; fotoPerfil: string | null } }

export function SolicitudesSeguimientoScreen() {
  const nav = useNav();
  const [lista, setLista] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/users/follow-requests');
        setLista(data.solicitudes);
      } catch (err) {
        setError(mensajeDeError(err));
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function resolver(s: Solicitud, accion: 'accept' | 'reject') {
    try {
      await api.post(`/api/users/follow-requests/${s.id}/${accion}`);
      setLista((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      Alert.alert('No se pudo completar', mensajeDeError(err));
    }
  }

  return (
    <Pantalla scroll={false}>
      <Encabezado titulo="Solicitudes de seguimiento" alVolver={nav.pop} />
      {cargando ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList
          data={lista}
          keyExtractor={(x) => String(x.id)}
          ListHeaderComponent={<View style={{ padding: error ? 16 : 0 }}><ErrorTexto texto={error} /></View>}
          ListEmptyComponent={<Vacio texto="No tienes solicitudes pendientes." />}
          renderItem={({ item }) => (
            <View style={s.fila}>
              <Avatar nombre={item.seguidor.nombre} foto={item.seguidor.fotoPerfil} tam={44} />
              <Text style={s.nombre} numberOfLines={1}>{item.seguidor.nombre}</Text>
              <Boton pequeno texto="Aceptar" onPress={() => void resolver(item, 'accept')} />
              <Boton pequeno variante="peligro" texto="Rechazar" onPress={() => void resolver(item, 'reject')} />
            </View>
          )}
        />
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: C.blanco, borderBottomWidth: 1, borderBottomColor: C.borde },
  nombre: { flex: 1, fontWeight: '700', color: C.texto },
});
