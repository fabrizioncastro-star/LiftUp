import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Campo } from '../components/Campo';
import { Pantalla } from '../components/Pantalla';
import { Boton, Encabezado, ErrorTexto } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { FeedItem } from '../types';

/** HU-005: editar descripción/datos y eliminar (con confirmación) una publicación propia. */
export function EditarPublicacionScreen({ publicacion: p }: { publicacion: FeedItem }) {
  const nav = useNav();
  const [descripcion, setDescripcion] = useState(p.descripcion ?? '');
  const [ejercicio, setEjercicio] = useState(p.ejercicio ?? '');
  const [peso, setPeso] = useState(p.pesoKg != null ? String(p.pesoKg) : '');
  const [series, setSeries] = useState(p.series != null ? String(p.series) : '');
  const [reps, setReps] = useState(p.repeticiones != null ? String(p.repeticiones) : '');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  function terminar() {
    nav.pop();
    nav.refrescar();
  }

  async function guardar() {
    setError('');
    setOcupado(true);
    try {
      await api.put(`/api/posts/${p.id}`, {
        descripcion, ejercicio, pesoKg: peso.trim().replace(',', '.'), series: series.trim(), repeticiones: reps.trim(),
      });
      terminar();
    } catch (err) {
      setError(mensajeDeError(err));
      setOcupado(false);
    }
  }

  function confirmarEliminar() {
    Alert.alert('Eliminar publicación', 'Esta acción no se puede deshacer. ¿Eliminar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          setOcupado(true);
          try {
            await api.delete(`/api/posts/${p.id}`);
            terminar();
          } catch (err) {
            setError(mensajeDeError(err));
            setOcupado(false);
          }
        },
      },
    ]);
  }

  return (
    <Pantalla>
      <Encabezado titulo="Editar publicación" alVolver={nav.pop} />
      <View style={{ height: 16 }} />
      <Campo etiqueta="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
      <Campo etiqueta="Ejercicio" value={ejercicio} onChangeText={setEjercicio} />
      <View style={s.fila}>
        <View style={{ flex: 1 }}><Campo etiqueta="Peso (kg)" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Series" value={series} onChangeText={setSeries} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Campo etiqueta="Reps" value={reps} onChangeText={setReps} keyboardType="number-pad" /></View>
      </View>
      <ErrorTexto texto={error} />
      <View style={{ gap: 10 }}>
        <Boton texto="Guardar" onPress={guardar} cargando={ocupado} />
        <Boton texto="Eliminar publicación" variante="peligro" onPress={confirmarEliminar} deshabilitado={ocupado} />
      </View>
    </Pantalla>
  );
}

const s = StyleSheet.create({ fila: { flexDirection: 'row', gap: 8 } });
