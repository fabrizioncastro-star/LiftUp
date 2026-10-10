import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Campo } from '../components/Campo';
import { Pantalla } from '../components/Pantalla';
import { Boton, ErrorTexto } from '../components/ui';
import { MedioElegido, archivoParaForm, elegirMedio } from '../media/seleccion';
import { C } from '../theme';

interface Props {
  alPublicar: () => void;
}

export function NuevaSesionScreen({ alPublicar }: Props) {
  const [medio, setMedio] = useState<MedioElegido | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [ejercicio, setEjercicio] = useState('');
  const [peso, setPeso] = useState('');
  const [series, setSeries] = useState('');
  const [reps, setReps] = useState('');
  const [error, setError] = useState('');
  const [progreso, setProgreso] = useState<number | null>(null);

  async function elegir() {
    const r = await elegirMedio(false, 'Formato no permitido');
    if (!r) return;
    if ('error' in r) { setMedio(null); setError(r.error); return; }
    setError('');
    setMedio(r.medio);
  }

  async function publicar() {
    if (!medio) { setError('Debes adjuntar una foto (JPG/PNG) o un video (MP4)'); return; }
    setError('');
    setProgreso(0);
    const form = new FormData();
    form.append('archivo', archivoParaForm(medio));
    if (descripcion.trim()) form.append('descripcion', descripcion.trim());
    if (ejercicio.trim()) form.append('ejercicio', ejercicio.trim());
    if (peso.trim()) form.append('pesoKg', peso.trim().replace(',', '.'));
    if (series.trim()) form.append('series', series.trim());
    if (reps.trim()) form.append('repeticiones', reps.trim());
    try {
      await api.post('/api/posts', form, {
        timeout: 120000,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgreso(e.total ? Math.round((e.loaded / e.total) * 100) : null),
      });
      setMedio(null); setDescripcion(''); setEjercicio(''); setPeso(''); setSeries(''); setReps('');
      alPublicar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProgreso(null);
    }
  }

  const subiendo = progreso !== null;

  return (
    <Pantalla>
      <Text style={s.titulo}>Nueva sesión</Text>
      <View style={{ height: 12 }} />

      <Pressable style={s.selector} onPress={elegir} disabled={subiendo}>
        {medio?.tipo === 'imagen' ? (
          <Image source={{ uri: medio.uri }} style={s.previa} />
        ) : (
          <Text style={s.selectorTxt}>{medio ? `🎬 Video: ${medio.nombre}` : 'Toca para elegir foto o video'}</Text>
        )}
      </Pressable>

      <Campo etiqueta="Descripción" value={descripcion} onChangeText={setDescripcion} placeholder="¿Cómo te fue hoy?" multiline />
      <Campo etiqueta="Ejercicio (opcional)" value={ejercicio} onChangeText={setEjercicio} placeholder="Sentadilla" />
      <View style={s.fila}>
        <View style={{ flex: 1 }}><Campo etiqueta="Peso (kg)" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Series" value={series} onChangeText={setSeries} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Reps" value={reps} onChangeText={setReps} keyboardType="number-pad" /></View>
      </View>

      <ErrorTexto texto={error} />
      {subiendo ? <Text style={s.progreso}>Subiendo… {progreso}%</Text> : null}
      <Boton texto={error && medio ? 'Reintentar' : 'Publicar'} onPress={publicar} cargando={subiendo} />
    </Pantalla>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: 26, fontWeight: '800', color: C.texto, marginTop: 8 },
  selector: { height: 200, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#9ca3af', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden', backgroundColor: C.blanco },
  selectorTxt: { color: C.suave, textAlign: 'center', padding: 12 },
  previa: { width: '100%', height: '100%' },
  fila: { flexDirection: 'row', gap: 8 },
  progreso: { color: C.primario, marginBottom: 8, fontWeight: '600' },
});
