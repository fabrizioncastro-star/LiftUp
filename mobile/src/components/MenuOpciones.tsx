import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

export interface Opcion { etiqueta: string; onPress: () => void; peligro?: boolean }

export function MenuOpciones({ visible, titulo, opciones, onCerrar }: { visible: boolean; titulo?: string; opciones: Opcion[]; onCerrar: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={s.fondo} onPress={onCerrar}>
        <View style={s.hoja}>
          {titulo ? <Text style={s.titulo}>{titulo}</Text> : null}
          {opciones.map((o) => (
            <Pressable key={o.etiqueta} style={s.opcion} onPress={() => { onCerrar(); o.onPress(); }}>
              <Text style={[s.opcionTxt, o.peligro && { color: C.peligro }]}>{o.etiqueta}</Text>
            </Pressable>
          ))}
          <Pressable style={[s.opcion, s.cancelar]} onPress={onCerrar}><Text style={s.cancelarTxt}>Cancelar</Text></Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  hoja: { backgroundColor: C.blanco, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 12, paddingBottom: 28 },
  titulo: { textAlign: 'center', color: C.suave, paddingVertical: 10, fontWeight: '600' },
  opcion: { paddingVertical: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: C.borde },
  opcionTxt: { fontSize: 17, color: C.texto },
  cancelar: { marginTop: 6 },
  cancelarTxt: { fontSize: 17, color: C.primario, fontWeight: '700' },
});
