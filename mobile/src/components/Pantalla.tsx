import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme';

interface Props {
  children: React.ReactNode;
  /** Contenido fijo debajo (p. ej. caja de comentario): sube junto con el teclado. */
  pie?: React.ReactNode;
  /** false = el contenido maneja su propio scroll (FlatList). */
  scroll?: boolean;
}

/**
 * Contenedor base de TODAS las pantallas:
 *  - respeta las zonas seguras (notch / barra de estado),
 *  - sube el contenido cuando aparece el teclado (KeyboardAvoidingView) para que nunca tape lo que se escribe,
 *  - permite tocar botones con el teclado abierto y cerrar el teclado al desplazarse.
 */
export function Pantalla({ children, pie, scroll = true }: Props) {
  return (
    <SafeAreaView style={s.raiz} edges={['top']}>
      <KeyboardAvoidingView style={s.raiz} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {scroll ? (
          <ScrollView
            style={s.raiz}
            contentContainerStyle={s.contenido}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets
          >
            {children}
          </ScrollView>
        ) : (
          <View style={s.raiz}>{children}</View>
        )}
        {pie}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: C.fondo },
  contenido: { padding: 20, paddingBottom: 48 },
});
