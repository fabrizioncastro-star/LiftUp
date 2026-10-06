import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { urlMedia } from '../api/client';
import { C } from '../theme';

export function Avatar({ nombre, foto, tam = 40 }: { nombre: string; foto?: string | null; tam?: number }) {
  const uri = urlMedia(foto);
  const caja = { width: tam, height: tam, borderRadius: tam / 2 };
  if (uri) return <Image source={{ uri }} style={caja} />;
  return (
    <View style={[s.vacio, caja]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: tam * 0.42 }}>{nombre.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const s = StyleSheet.create({ vacio: { backgroundColor: C.primario, alignItems: 'center', justifyContent: 'center' } });
