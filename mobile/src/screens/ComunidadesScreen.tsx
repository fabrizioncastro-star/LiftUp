import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Pantalla } from '../components/Pantalla';
import { Boton, ErrorTexto, Segmentado, Tarjeta, Vacio } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { Comunidad, SolicitudComunidad } from '../types';

type Seccion = 'explorar' | 'mias' | 'solicitudes';

const ESTADO: Record<SolicitudComunidad['estado'], { txt: string; color: string }> = {
  pendiente: { txt: '⏳ Pendiente', color: C.aviso },
  aprobada: { txt: '✅ Aprobada', color: C.ok },
  rechazada: { txt: '✖ Rechazada', color: C.peligro },
};

export function ComunidadesScreen() {
  const nav = useNav();
  const [seccion, setSeccion] = useState<Seccion>('explorar');
  const [q, setQ] = useState('');
  const [lista, setLista] = useState<Comunidad[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudComunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      if (seccion === 'solicitudes') {
        const { data } = await api.get('/api/communities/requests/mine');
        setSolicitudes(data.solicitudes);
      } else {
        const { data } = await api.get(seccion === 'mias' ? '/api/communities/mine' : '/api/communities', { params: seccion === 'explorar' && q.trim() ? { q: q.trim() } : undefined });
        setLista(data.comunidades);
      }
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, [seccion, q]);

  useEffect(() => {
    const t = setTimeout(() => { void cargar(); }, seccion === 'explorar' ? 300 : 0);
    return () => clearTimeout(t);
  }, [cargar, nav.version]);

  async function unirse(c: Comunidad) {
    try {
      await api.post(`/api/communities/${c.id}/join`, {}, { timeout: 5000 });
      await cargar();
      nav.push({ n: 'comunidad', c: { ...c, esMiembro: true, miembros: c.miembros + 1 } });
    } catch (err) {
      Alert.alert('No se pudo unir', mensajeDeError(err));
    }
  }

  return (
    <Pantalla>
      <Text style={s.titulo}>Comunidades</Text>
      <Segmentado
        opciones={[{ valor: 'explorar', etiqueta: 'Explorar' }, { valor: 'mias', etiqueta: 'Mis comunidades' }, { valor: 'solicitudes', etiqueta: 'Mis solicitudes' }]}
        valor={seccion} onCambio={(v) => { setCargando(true); setSeccion(v); }}
      />

      {seccion === 'explorar' && (
        <TextInput style={s.buscador} value={q} onChangeText={setQ} placeholder="Buscar por nombre, sede o disciplina…" placeholderTextColor="#9ca3af" autoCapitalize="none" />
      )}
      <ErrorTexto texto={error} />
      {cargando ? <ActivityIndicator style={{ marginTop: 30 }} /> : null}

      {!cargando && seccion !== 'solicitudes' && (
        lista.length === 0
          ? <Vacio texto={seccion === 'mias' ? 'Aún no te unes a ninguna comunidad.' : 'No encontramos comunidades con esa búsqueda.'} />
          : lista.map((c) => (
            <Tarjeta key={c.id}>
              <Text style={s.nombre}>{c.nombre}</Text>
              <Text style={s.meta}>{c.tipo} · {c.miembros} {c.miembros === 1 ? 'miembro' : 'miembros'}</Text>
              {c.descripcion ? <Text style={s.desc}>{c.descripcion}</Text> : null}
              <View style={{ marginTop: 10 }}>
                {c.esMiembro
                  ? <Boton pequeno variante="secundario" texto="Entrar" onPress={() => nav.push({ n: 'comunidad', c })} />
                  : <Boton pequeno texto="Unirse" onPress={() => void unirse(c)} />}
              </View>
            </Tarjeta>
          ))
      )}

      {!cargando && seccion === 'solicitudes' && (
        <>
          <Boton texto="+ Solicitar una comunidad" onPress={() => nav.push({ n: 'nuevaComunidad' })} />
          <View style={{ height: 14 }} />
          {solicitudes.length === 0
            ? <Vacio texto="No has enviado solicitudes." />
            : solicitudes.map((x) => (
              <Tarjeta key={x.id}>
                <Text style={s.nombre}>{x.nombre}</Text>
                <Text style={s.meta}>{x.tipo}</Text>
                <Text style={[s.estado, { color: ESTADO[x.estado].color }]}>{ESTADO[x.estado].txt}</Text>
              </Tarjeta>
            ))}
        </>
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: 26, fontWeight: '800', color: C.texto, marginBottom: 14, marginTop: 8 },
  buscador: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: C.blanco, color: C.texto, marginBottom: 12 },
  nombre: { fontSize: 17, fontWeight: '800', color: C.texto },
  meta: { color: C.suave, marginTop: 2 },
  desc: { color: '#374151', marginTop: 6, lineHeight: 20 },
  estado: { fontWeight: '700', marginTop: 6 },
});
