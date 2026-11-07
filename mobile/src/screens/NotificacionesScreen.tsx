import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { api, fechaCorta, mensajeDeError } from '../api/client';
import { Pantalla } from '../components/Pantalla';
import { Encabezado, ErrorTexto, Vacio } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { Notificacion } from '../types';

const ICONOS: Record<string, string> = {
  record: '🏆', logro: '🎖️', comentario: '💬', nuevo_seguidor: '👤', solicitud_seguimiento: '🔔', solicitud_aceptada: '✅',
  comunidad_aprobada: '🎉', comunidad_rechazada: '📭', publicacion_eliminada: '⚠️',
};

export function NotificacionesScreen() {
  const nav = useNav();
  const [lista, setLista] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/notifications');
        setLista(data.notificaciones);
        if (data.noLeidas > 0) await api.post('/api/notifications/read');
      } catch (err) {
        setError(mensajeDeError(err));
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  return (
    <Pantalla scroll={false}>
      <Encabezado titulo="Notificaciones" alVolver={() => { nav.pop(); nav.refrescar(); }} />
      {cargando ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList
          data={lista}
          keyExtractor={(n) => String(n.id)}
          ListHeaderComponent={<ErrorTexto texto={error} />}
          ListEmptyComponent={<Vacio texto="No tienes notificaciones todavía." />}
          renderItem={({ item }) => (
            <View style={[s.fila, !item.leida && s.nueva]}>
              <Text style={s.icono}>{ICONOS[item.tipo] ?? '🔔'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.mensaje}>{item.mensaje}</Text>
                <Text style={s.fecha}>{fechaCorta(item.fecha)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: C.blanco, borderBottomWidth: 1, borderBottomColor: C.borde, gap: 12 },
  nueva: { backgroundColor: C.primarioSuave },
  icono: { fontSize: 24 },
  mensaje: { color: C.texto, fontSize: 15, lineHeight: 20 },
  fecha: { color: C.suave, fontSize: 12, marginTop: 2 },
});
