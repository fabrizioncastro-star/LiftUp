import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, fechaCorta, mensajeDeError, urlMedia } from '../api/client';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { FeedItem, REACCIONES } from '../types';
import { Avatar } from './Avatar';
import { MenuOpciones } from './MenuOpciones';
import { ReportarMenu, enviarReporte } from './Reportar';

function Video({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={s.media} nativeControls contentFit="contain" />;
}

export function PostCard({ item }: { item: FeedItem }) {
  const nav = useNav();
  const uri = urlMedia(item.archivoUrl) as string;
  const [total, setTotal] = useState(item.totalReacciones);
  const [mia, setMia] = useState<string | null>(item.miReaccion);
  const [comentarios, setComentarios] = useState(item.totalComentarios);
  const [menu, setMenu] = useState(false);
  const [motivos, setMotivos] = useState(false);

  const datos = [
    item.ejercicio,
    item.pesoKg != null ? `${item.pesoKg} kg` : null,
    item.series != null && item.repeticiones != null ? `${item.series}×${item.repeticiones}` : null,
  ].filter(Boolean);

  async function reaccionar(tipo: string) {
    try {
      const { data } = await api.post(`/api/posts/${item.id}/reactions`, { tipo }, { timeout: 5000 });
      setTotal(data.total);
      setMia(data.miReaccion);
    } catch (err) {
      Alert.alert('No se pudo reaccionar', mensajeDeError(err));
    }
  }

  return (
    <View style={s.card}>
      <View style={s.cabecera}>
        <Pressable style={s.autorFila} onPress={() => (item.esMia ? undefined : nav.push({ n: 'usuario', id: item.autor.id }))}>
          <Avatar nombre={item.autor.nombre} foto={item.autor.fotoPerfil} tam={36} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.autor}>{item.autor.nombre}{item.deSeguido ? ' · Siguiendo' : ''}</Text>
            <Text style={s.fecha}>{fechaCorta(item.fecha)}</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setMenu(true)} hitSlop={12} accessibilityLabel="Más opciones">
          <Text style={s.puntos}>•••</Text>
        </Pressable>
      </View>

      {item.tipoArchivo === 'video' ? <Video uri={uri} /> : <Image source={{ uri }} style={s.media} resizeMode="cover" />}

      {datos.length > 0 ? <Text style={s.datos}>{datos.join(' · ')}</Text> : null}
      {item.descripcion ? <Text style={s.desc}>{item.descripcion}</Text> : null}

      <View style={s.reacciones}>
        {REACCIONES.map((r) => (
          <Pressable key={r.tipo} style={[s.reaccion, mia === r.tipo && s.reaccionActiva]} onPress={() => reaccionar(r.tipo)} accessibilityLabel={r.etiqueta}>
            <Text style={s.reaccionIcono}>{r.icono}</Text>
          </Pressable>
        ))}
        <Text style={s.contador}>{total} {total === 1 ? 'reacción' : 'reacciones'}</Text>
        <Pressable
          style={s.comentarBtn}
          onPress={() => nav.push({ n: 'comentarios', pub: item, alCambiar: setComentarios })}
          accessibilityLabel="Comentarios"
        >
          <Text style={s.comentarTxt}>💬 {comentarios}</Text>
        </Pressable>
      </View>

      <MenuOpciones
        visible={menu}
        onCerrar={() => setMenu(false)}
        opciones={item.esMia
          ? [{ etiqueta: 'Editar o eliminar', onPress: () => nav.push({ n: 'editarPublicacion', pub: item }) }]
          : [{ etiqueta: 'Reportar publicación', peligro: true, onPress: () => setMotivos(true) }]}
      />
      <ReportarMenu visible={motivos} onCerrar={() => setMotivos(false)} onElegir={(m) => void enviarReporte('publicaciones', item.id, m)} />
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.blanco, marginBottom: 12, paddingBottom: 12 },
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  autorFila: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  autor: { fontWeight: '700', color: C.texto },
  fecha: { color: C.suave, fontSize: 12 },
  puntos: { color: C.suave, fontSize: 18, letterSpacing: 1, paddingHorizontal: 6 },
  media: { width: '100%', aspectRatio: 1, backgroundColor: '#111827' },
  datos: { marginTop: 10, marginHorizontal: 12, fontWeight: '700', color: C.primario },
  desc: { marginTop: 6, marginHorizontal: 12, color: C.texto, lineHeight: 20 },
  reacciones: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginHorizontal: 12, gap: 8 },
  reaccion: { width: 40, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  reaccionActiva: { backgroundColor: C.primarioSuave, borderWidth: 1.5, borderColor: C.primario },
  reaccionIcono: { fontSize: 18 },
  contador: { flex: 1, color: C.suave, fontSize: 13, marginLeft: 4 },
  comentarBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f3f4f6' },
  comentarTxt: { color: C.texto, fontWeight: '600' },
});
