import React from 'react';
import { Alert } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { MOTIVOS_REPORTE } from '../types';
import { MenuOpciones } from './MenuOpciones';

export async function enviarReporte(tipo: 'publicaciones' | 'usuarios', id: number, motivo: string): Promise<void> {
  const ruta = tipo === 'publicaciones' ? `/api/posts/${id}/reports` : `/api/users/${id}/reports`;
  try {
    await api.post(ruta, { motivo });
    Alert.alert('Reporte enviado', 'Gracias. El equipo de moderación lo revisará.');
  } catch (err) {
    Alert.alert('No se pudo reportar', mensajeDeError(err));
  }
}

export function ReportarMenu({ visible, onCerrar, onElegir }: { visible: boolean; onCerrar: () => void; onElegir: (motivo: string) => void }) {
  return (
    <MenuOpciones
      visible={visible}
      titulo="¿Por qué quieres reportar esto?"
      onCerrar={onCerrar}
      opciones={MOTIVOS_REPORTE.map((m) => ({ etiqueta: m.etiqueta, onPress: () => onElegir(m.valor) }))}
    />
  );
}
