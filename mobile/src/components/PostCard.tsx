import { VideoView, useVideoPlayer } from 'expo-video';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { fechaCorta, urlMedia } from '../api/client';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { FeedItem } from '../types';
import { Avatar } from './Avatar';

function Video({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={s.media} nativeControls contentFit="contain" />;
}

export function PostCard({ item }: { item: FeedItem }) {
  const nav = useNav();
  const uri = urlMedia(item.archivoUrl) as string;
  const datos = [
    item.ejercicio,
    item.pesoKg != null ? `${item.pesoKg} kg` : null,
    item.series != null && item.repeticiones != null ? `${item.series}×${item.repeticiones}` : null,
  ].filter(Boolean);

  return (
    <View style={s.card}>
      <View style={s.cabecera}>
        <Avatar nombre={item.autor.nombre} foto={item.autor.fotoPerfil} tam={36} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.autor}>{item.autor.nombre}{item.deSeguido ? ' · Siguiendo' : ''}</Text>
          <Text style={s.fecha}>{fechaCorta(item.fecha)}</Text>
        </View>
        {item.esMia ? (
          <Pressable onPress={() => nav.push({ n: 'editarPublicacion', pub: item })} hitSlop={12}>
            <Text style={s.editar}>Editar</Text>
          </Pressable>
        ) : null}
      </View>

      {item.tipoArchivo === 'video' ? <Video uri={uri} /> : <Image source={{ uri }} style={s.media} resizeMode="cover" />}

      {datos.length > 0 ? <Text style={s.datos}>{datos.join(' · ')}</Text> : null}
      {item.descripcion ? <Text style={s.desc}>{item.descripcion}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.blanco, marginBottom: 12, paddingBottom: 12 },
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  autor: { fontWeight: '700', color: C.texto },
  fecha: { color: C.suave, fontSize: 12 },
  editar: { color: C.primario, fontWeight: '600' },
  media: { width: '100%', aspectRatio: 1, backgroundColor: '#111827' },
  datos: { marginTop: 10, marginHorizontal: 12, fontWeight: '700', color: C.primario },
  desc: { marginTop: 6, marginHorizontal: 12, color: C.texto, lineHeight: 20 },
});
