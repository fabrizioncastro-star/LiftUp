import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { C } from '../theme';

interface Props extends TextInputProps {
  etiqueta: string;
  error?: string;
}

/** Campo de formulario reutilizable (etiqueta + input + mensaje de error). */
export function Campo({ etiqueta, error, multiline, ...resto }: Props) {
  return (
    <View style={s.wrap}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[s.input, multiline && s.multilinea, error ? s.inputError : null]}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...resto}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 14 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: C.texto, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: C.blanco, color: C.texto },
  multilinea: { minHeight: 90 },
  inputError: { borderColor: C.peligro },
  error: { color: C.peligro, fontSize: 13, marginTop: 4 },
});
