import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Campo } from '../components/Campo';
import { Pantalla } from '../components/Pantalla';
import { Boton, Encabezado, ErrorTexto } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';

const TIPOS = ['Sede de gimnasio', 'Disciplina deportiva', 'Otro'];

export function NuevaComunidadScreen() {
  const nav = useNav();
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [descripcion, setDescripcion] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  async function enviar() {
    setError('');
    if (nombre.trim().length < 3) { setErrorNombre('El nombre debe tener al menos 3 caracteres'); return; }
    setErrorNombre('');
    setEnviando(true);
    try {
      await api.post('/api/communities/requests', { nombre: nombre.trim(), tipo, descripcion: descripcion.trim() }, { timeout: 10000 });
      setEnviada(true);
      nav.refrescar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Encabezado titulo="Solicitar comunidad" alVolver={nav.pop} />
      <View style={{ height: 16 }} />
      {enviada ? (
        <>
          <Text style={s.ok}>✅ Solicitud enviada</Text>
          <Text style={s.sub}>Quedó en estado «Pendiente». Te avisaremos cuando un administrador la revise.</Text>
          <Boton texto="Volver" onPress={nav.pop} />
        </>
      ) : (
        <>
          <Campo etiqueta="Nombre de la comunidad" value={nombre} onChangeText={setNombre} error={errorNombre} placeholder="Gym Miraflores" />
          <Text style={s.etiqueta}>Tipo</Text>
          <View style={s.chips}>
            {TIPOS.map((t) => (
              <Pressable key={t} style={[s.chip, tipo === t && s.chipActivo]} onPress={() => setTipo(t)}>
                <Text style={[s.chipTxt, tipo === t && s.chipTxtActivo]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Campo etiqueta="Descripción" value={descripcion} onChangeText={setDescripcion} multiline maxLength={500} placeholder="¿De qué trata la comunidad?" />
          <ErrorTexto texto={error} />
          <Boton texto="Enviar solicitud" onPress={enviar} cargando={enviando} />
        </>
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  ok: { color: C.ok, fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sub: { color: C.suave, marginBottom: 20, lineHeight: 20 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: C.texto, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.blanco },
  chipActivo: { backgroundColor: C.primario, borderColor: C.primario },
  chipTxt: { color: '#374151' },
  chipTxtActivo: { color: '#fff', fontWeight: '700' },
});
