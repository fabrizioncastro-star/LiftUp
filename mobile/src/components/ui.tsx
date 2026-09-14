import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

type Variante = 'primario' | 'secundario' | 'peligro' | 'peligroSolido';

export function Boton({
  texto, onPress, variante = 'primario', cargando, deshabilitado, pequeno,
}: { texto: string; onPress: () => void; variante?: Variante; cargando?: boolean; deshabilitado?: boolean; pequeno?: boolean }) {
  const inactivo = cargando || deshabilitado;
  return (
    <Pressable
      style={[s.boton, s[variante], pequeno && s.pequeno, inactivo && { opacity: 0.55 }]}
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'primario' || variante === 'peligroSolido' ? '#fff' : C.primario} />
      ) : (
        <Text style={[s.texto, textoDe[variante], pequeno && { fontSize: 14 }]}>{texto}</Text>
      )}
    </Pressable>
  );
}

/** Encabezado de pantalla con botón "Volver" opcional y acción a la derecha. */
export function Encabezado({ titulo, alVolver, derecha }: { titulo: string; alVolver?: () => void; derecha?: React.ReactNode }) {
  return (
    <View style={s.encabezado}>
      {alVolver ? (
        <Pressable onPress={alVolver} hitSlop={12} style={s.volver} accessibilityRole="button" accessibilityLabel="Volver">
          <Text style={s.volverTxt}>‹ Volver</Text>
        </Pressable>
      ) : null}
      <Text style={s.titulo} numberOfLines={1}>{titulo}</Text>
      <View style={s.derecha}>{derecha}</View>
    </View>
  );
}

/** Control segmentado de pestañas internas. */
export function Segmentado<T extends string>({
  opciones, valor, onCambio,
}: { opciones: { valor: T; etiqueta: string }[]; valor: T; onCambio: (v: T) => void }) {
  return (
    <View style={s.segmentado}>
      {opciones.map((o) => (
        <Pressable key={o.valor} style={[s.segmento, valor === o.valor && s.segmentoActivo]} onPress={() => onCambio(o.valor)}>
          <Text style={[s.segmentoTxt, valor === o.valor && s.segmentoTxtActivo]} numberOfLines={1}>{o.etiqueta}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return <Text style={s.vacio}>{texto}</Text>;
}

export function ErrorTexto({ texto }: { texto: string }) {
  return texto ? <Text style={s.error}>{texto}</Text> : null;
}

export function Tarjeta({ children }: { children: React.ReactNode }) {
  return <View style={s.tarjeta}>{children}</View>;
}

const s = StyleSheet.create({
  boton: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pequeno: { paddingVertical: 9, paddingHorizontal: 14 },
  primario: { backgroundColor: C.primario },
  secundario: { backgroundColor: C.blanco, borderWidth: 1, borderColor: C.primario },
  peligro: { backgroundColor: C.blanco, borderWidth: 1, borderColor: C.peligro },
  peligroSolido: { backgroundColor: C.peligro },
  texto: { fontWeight: '700', fontSize: 16 },
  encabezado: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.blanco, borderBottomWidth: 1, borderBottomColor: C.borde },
  volver: { marginRight: 10 },
  volverTxt: { color: C.primario, fontSize: 16, fontWeight: '600' },
  titulo: { flex: 1, fontSize: 20, fontWeight: '800', color: C.texto },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  segmentado: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 10, padding: 3, marginBottom: 14 },
  segmento: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentoActivo: { backgroundColor: C.blanco },
  segmentoTxt: { color: C.suave, fontWeight: '600', fontSize: 13 },
  segmentoTxtActivo: { color: C.primario },
  vacio: { color: C.suave, textAlign: 'center', marginVertical: 24, fontSize: 15 },
  error: { color: C.peligro, marginBottom: 10 },
  tarjeta: { backgroundColor: C.blanco, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.borde },
});

const textoDe: Record<Variante, { color: string }> = {
  primario: { color: '#fff' },
  secundario: { color: C.primario },
  peligro: { color: C.peligro },
  peligroSolido: { color: '#fff' },
};
