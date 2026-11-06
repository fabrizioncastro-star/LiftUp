import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Pantalla } from '../components/Pantalla';
import { Boton, Encabezado, ErrorTexto } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { Privacidad } from '../types';

const OPCIONES: { valor: Privacidad; titulo: string; detalle: string }[] = [
  { valor: 'publica', titulo: 'Pública', detalle: 'Cualquier persona puede seguirte y ver tus publicaciones.' },
  { valor: 'solo_amigos', titulo: 'Solo amigos', detalle: 'Debes aceptar a cada persona; solo ven tu contenido quienes se siguen mutuamente contigo.' },
  { valor: 'privada', titulo: 'Privada', detalle: 'Debes aceptar a cada persona; solo tus seguidores aceptados ven tu contenido.' },
];

export function PrivacidadScreen() {
  const nav = useNav();
  const { usuario, actualizarUsuario } = useAuth();
  const [valor, setValor] = useState<Privacidad>(usuario?.privacidad ?? 'publica');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    setError('');
    setGuardado(false);
    setGuardando(true);
    try {
      await api.put('/api/users/privacy', { privacidad: valor }, { timeout: 10000 });
      if (usuario) actualizarUsuario({ ...usuario, privacidad: valor });
      setGuardado(true);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Pantalla>
      <Encabezado titulo="Privacidad" alVolver={nav.pop} />
      <View style={{ height: 16 }} />
      {OPCIONES.map((o) => (
        <Pressable key={o.valor} style={[s.opcion, valor === o.valor && s.activa]} onPress={() => { setValor(o.valor); setGuardado(false); }}>
          <View style={[s.radio, valor === o.valor && s.radioActivo]} />
          <View style={{ flex: 1 }}>
            <Text style={s.titulo}>{o.titulo}</Text>
            <Text style={s.detalle}>{o.detalle}</Text>
          </View>
        </Pressable>
      ))}
      <ErrorTexto texto={error} />
      {guardado ? <Text style={s.ok}>✓ Configuración guardada</Text> : null}
      <Boton texto="Guardar" onPress={guardar} cargando={guardando} />
    </Pantalla>
  );
}

const s = StyleSheet.create({
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.blanco, borderRadius: 12, borderWidth: 1.5, borderColor: C.borde, marginBottom: 10 },
  activa: { borderColor: C.primario, backgroundColor: C.primarioSuave },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#9ca3af' },
  radioActivo: { borderColor: C.primario, backgroundColor: C.primario },
  titulo: { fontWeight: '700', color: C.texto, fontSize: 16 },
  detalle: { color: C.suave, marginTop: 2, lineHeight: 18 },
  ok: { color: C.ok, fontWeight: '700', marginBottom: 10 },
});
