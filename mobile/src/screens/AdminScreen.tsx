import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { api, fechaCorta, mensajeDeError, urlMedia } from '../api/client';
import { Pantalla } from '../components/Pantalla';
import { Boton, Encabezado, ErrorTexto, Segmentado, Tarjeta, Vacio } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { AccionHistorial, MOTIVOS_REPORTE, ReporteAdmin, SolicitudAdmin } from '../types';

type Seccion = 'reportes' | 'comunidades' | 'historial';

function confirmar(titulo: string, mensaje: string, textoOk: string, accion: () => Promise<void>) {
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    { text: textoOk, style: 'destructive', onPress: () => void accion() },
  ]);
}

export function AdminScreen() {
  const nav = useNav();
  const [seccion, setSeccion] = useState<Seccion>('reportes');
  const [reportes, setReportes] = useState<ReporteAdmin[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmin[]>([]);
  const [historial, setHistorial] = useState<AccionHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      if (seccion === 'reportes') setReportes((await api.get('/api/admin/reports')).data.reportes);
      else if (seccion === 'comunidades') setSolicitudes((await api.get('/api/admin/community-requests')).data.solicitudes);
      else setHistorial((await api.get('/api/admin/history')).data.acciones);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, [seccion]);

  useEffect(() => { void cargar(); }, [cargar]);

  async function ejecutar(fn: () => Promise<unknown>, exito: string) {
    try {
      await fn();
      Alert.alert('Listo', exito);
      nav.refrescar();
      await cargar();
    } catch (err) {
      Alert.alert('No se pudo completar', mensajeDeError(err));
    }
  }

  const motivo = (m: string) => MOTIVOS_REPORTE.find((x) => x.valor === m)?.etiqueta ?? m;

  return (
    <Pantalla>
      <Encabezado titulo="Administración" alVolver={nav.pop} />
      <View style={{ height: 14 }} />
      <Segmentado
        opciones={[{ valor: 'reportes', etiqueta: 'Reportes' }, { valor: 'comunidades', etiqueta: 'Comunidades' }, { valor: 'historial', etiqueta: 'Historial' }]}
        valor={seccion} onCambio={(v) => { setCargando(true); setSeccion(v); }}
      />
      <ErrorTexto texto={error} />
      {cargando ? <ActivityIndicator style={{ marginTop: 30 }} /> : null}

      {!cargando && seccion === 'reportes' && (
        reportes.length === 0 ? <Vacio texto="No hay reportes pendientes. 🎉" /> : reportes.map((r) => {
          const autorId = r.publicacion?.autor.id ?? r.usuario?.id;
          const autorNombre = r.publicacion?.autor.nombre ?? r.usuario?.nombre ?? '';
          return (
            <Tarjeta key={r.id}>
              <Text style={s.tipo}>{r.tipo === 'publicacion' ? '📷 Publicación reportada' : '👤 Usuario reportado'}</Text>
              {r.publicacion ? (
                <View style={{ marginVertical: 8 }}>
                  {r.publicacion.tipoArchivo === 'imagen'
                    ? <Image source={{ uri: urlMedia(r.publicacion.archivoUrl) as string }} style={s.miniatura} />
                    : <Text style={s.video}>🎬 Video</Text>}
                  {r.publicacion.descripcion ? <Text style={s.texto}>“{r.publicacion.descripcion}”</Text> : null}
                  <Text style={s.meta}>Autor: {r.publicacion.autor.nombre}</Text>
                </View>
              ) : r.usuario ? (
                <Text style={s.texto}>{r.usuario.nombre}{r.usuario.estado === 'suspendido' ? ' (ya suspendido)' : ''}</Text>
              ) : <Text style={s.meta}>El contenido ya fue eliminado.</Text>}
              <Text style={s.meta}>Motivo: <Text style={s.fuerte}>{motivo(r.motivo)}</Text></Text>
              <Text style={s.meta}>Reportó: {r.reportante.nombre} · {fechaCorta(r.fecha)}</Text>
              <View style={s.acciones}>
                {r.publicacion ? (
                  <Boton pequeno variante="peligro" texto="Eliminar publicación" onPress={() => confirmar('Eliminar publicación', 'La publicación se borrará de todos los feeds y se avisará al autor.', 'Eliminar', () => ejecutar(() => api.delete(`/api/admin/posts/${r.publicacion!.id}`), 'Publicación eliminada.'))} />
                ) : null}
                {autorId && (r.publicacion || r.usuario?.estado !== 'suspendido') ? (
                  <Boton pequeno variante="peligro" texto={`Suspender a ${autorNombre}`} onPress={() => confirmar('Suspender cuenta', `${autorNombre} no podrá acceder a la plataforma.`, 'Suspender', () => ejecutar(() => api.post(`/api/admin/users/${autorId}/suspend`), 'Cuenta suspendida.'))} />
                ) : null}
                <Boton pequeno variante="secundario" texto="Descartar reporte" onPress={() => void ejecutar(() => api.post(`/api/admin/reports/${r.id}/dismiss`), 'Reporte descartado.')} />
              </View>
            </Tarjeta>
          );
        })
      )}

      {!cargando && seccion === 'comunidades' && (
        solicitudes.length === 0 ? <Vacio texto="No hay solicitudes de comunidad pendientes." /> : solicitudes.map((x) => (
          <Tarjeta key={x.id}>
            <Text style={s.tipo}>{x.nombre}</Text>
            <Text style={s.meta}>{x.tipo} · pedida por {x.solicitante.nombre} · {fechaCorta(x.fecha)}</Text>
            {x.descripcion ? <Text style={s.texto}>{x.descripcion}</Text> : null}
            <View style={s.acciones}>
              <Boton pequeno texto="Aprobar" onPress={() => void ejecutar(() => api.post(`/api/admin/community-requests/${x.id}/approve`), 'Comunidad creada y solicitante notificado.')} />
              <Boton pequeno variante="peligro" texto="Rechazar" onPress={() => confirmar('Rechazar solicitud', `Se rechazará la comunidad «${x.nombre}» y se avisará a quien la pidió.`, 'Rechazar', () => ejecutar(() => api.post(`/api/admin/community-requests/${x.id}/reject`), 'Solicitud rechazada.'))} />
            </View>
          </Tarjeta>
        ))
      )}

      {!cargando && seccion === 'historial' && (
        historial.length === 0 ? <Vacio texto="Aún no hay acciones registradas." /> : historial.map((h) => (
          <Tarjeta key={h.id}>
            <Text style={s.tipo}>{h.accion.replace(/_/g, ' ')}</Text>
            {h.detalle ? <Text style={s.texto}>{h.detalle}</Text> : null}
            <Text style={s.meta}>{h.admin} · {fechaCorta(h.fecha)}</Text>
          </Tarjeta>
        ))
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  tipo: { fontWeight: '800', color: C.texto, fontSize: 16, textTransform: 'capitalize' },
  texto: { color: '#374151', marginTop: 4, lineHeight: 20 },
  meta: { color: C.suave, marginTop: 3, fontSize: 13 },
  fuerte: { color: C.texto, fontWeight: '700' },
  miniatura: { width: '100%', height: 180, borderRadius: 8, backgroundColor: '#111827', marginBottom: 6 },
  video: { color: C.suave, marginBottom: 6 },
  acciones: { gap: 8, marginTop: 12 },
});
