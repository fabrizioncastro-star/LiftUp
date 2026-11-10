import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { api, fechaCorta, mensajeDeError } from '../api/client';
import { Campo } from '../components/Campo';
import { Pantalla } from '../components/Pantalla';
import { Boton, ErrorTexto, Segmentado, Tarjeta, Vacio } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { Logro, RecordPersonal, ResumenProgreso, SesionHistorial } from '../types';

type Seccion = 'resumen' | 'records' | 'logros' | 'historial';

const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

export function ProgresoScreen() {
  const nav = useNav();
  const [seccion, setSeccion] = useState<Seccion>('resumen');
  const [resumen, setResumen] = useState<ResumenProgreso | null>(null);
  const [historial, setHistorial] = useState<SesionHistorial[]>([]);
  const [records, setRecords] = useState<RecordPersonal[]>([]);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [r, h, rc, l] = await Promise.all([
        api.get('/api/progress/summary'), api.get('/api/progress/history'),
        api.get('/api/progress/records'), api.get('/api/progress/achievements'),
      ]);
      setResumen(r.data); setHistorial(h.data.sesiones); setRecords(rc.data.records); setLogros(l.data.logros);
      setError('');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar, nav.version]);

  return (
    <Pantalla>
      <Text style={s.titulo}>Mi progreso</Text>
      <Segmentado
        opciones={[{ valor: 'resumen', etiqueta: 'Resumen' }, { valor: 'records', etiqueta: 'Récords' }, { valor: 'logros', etiqueta: 'Logros' }, { valor: 'historial', etiqueta: 'Historial' }]}
        valor={seccion} onCambio={setSeccion}
      />
      <ErrorTexto texto={error} />
      {cargando ? <ActivityIndicator style={{ marginTop: 30 }} /> : null}

      {!cargando && seccion === 'resumen' && resumen && (
        <>
          <View style={s.fila}>
            <View style={[s.dato, { backgroundColor: '#fff7ed' }]}>
              <Text style={s.grande}>🔥 {resumen.rachaActual}</Text>
              <Text style={s.etq}>{resumen.rachaActual === 1 ? 'día de racha' : 'días de racha'}</Text>
            </View>
            <View style={s.dato}>
              <Text style={s.grande}>🏅 {resumen.rachaMaxima}</Text>
              <Text style={s.etq}>racha máxima</Text>
            </View>
          </View>
          <View style={[s.dato, { marginBottom: 12 }]}>
            <Text style={s.grande}>🏋️ {resumen.totalSesiones}</Text>
            <Text style={s.etq}>{resumen.totalSesiones === 1 ? 'sesión publicada' : 'sesiones publicadas'}</Text>
          </View>
          <Text style={s.nota}>
            {resumen.rachaActual === 0
              ? 'Publica una sesión hoy para empezar una nueva racha.'
              : 'Publica una sesión cada día para mantener tu racha. Tu meta eres tú mismo.'}
          </Text>
        </>
      )}

      {!cargando && seccion === 'records' && <RecordsSeccion records={records} alGuardar={cargar} />}

      {!cargando && seccion === 'logros' && (
        logros.length === 0
          ? <Vacio texto="Aún no tienes logros. Publica sesiones y registra récords para desbloquearlos." />
          : logros.map((l) => (
            <Tarjeta key={l.codigo}>
              <Text style={s.logro}>🎖️ {l.nombre}</Text>
              <Text style={s.etq}>Obtenido el {fechaCorta(l.fechaObtenido)}</Text>
            </Tarjeta>
          ))
      )}

      {!cargando && seccion === 'historial' && (
        historial.length === 0
          ? <Vacio texto="Todavía no has publicado sesiones." />
          : historial.map((h) => (
            <Tarjeta key={h.id}>
              <Text style={s.fecha}>{fechaCorta(h.fecha)}</Text>
              <Text style={s.logro}>{h.ejercicio ?? 'Sesión de entrenamiento'}</Text>
              {h.pesoKg != null || h.series != null ? (
                <Text style={s.datos}>{[h.pesoKg != null ? `${h.pesoKg} kg` : null, h.series != null && h.repeticiones != null ? `${h.series}×${h.repeticiones}` : null].filter(Boolean).join(' · ')}</Text>
              ) : null}
              {h.descripcion ? <Text style={s.desc} numberOfLines={2}>{h.descripcion}</Text> : null}
            </Tarjeta>
          ))
      )}
    </Pantalla>
  );
}

function RecordsSeccion({ records, alGuardar }: { records: RecordPersonal[]; alGuardar: () => Promise<void> }) {
  const [ejercicio, setEjercicio] = useState('');
  const [peso, setPeso] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function registrar() {
    setError('');
    setGuardando(true);
    try {
      const { data } = await api.post('/api/progress/records', { ejercicio, peso: peso.replace(',', '.'), fecha }, { timeout: 10000 });
      setEjercicio(''); setPeso('');
      const logros = (data.logrosNuevos as Logro[]).map((l) => `🎖️ ${l.nombre}`).join('\n');
      Alert.alert(
        data.esNuevoRecord ? '🏆 ¡Nuevo récord!' : 'Récord guardado',
        [data.esNuevoRecord ? `Superaste tu marca anterior en ${data.record.ejercicio}.` : `${data.record.ejercicio}: ${data.record.peso} kg`, logros && `\nLogros desbloqueados:\n${logros}`].filter(Boolean).join('\n'),
      );
      await alGuardar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <Tarjeta>
        <Text style={s.logro}>Registrar un récord</Text>
        <View style={{ height: 10 }} />
        <Campo etiqueta="Ejercicio" value={ejercicio} onChangeText={setEjercicio} placeholder="Sentadilla" />
        <View style={s.fila}>
          <View style={{ flex: 1 }}><Campo etiqueta="Peso (kg)" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Campo etiqueta="Fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} autoCapitalize="none" /></View>
        </View>
        <ErrorTexto texto={error} />
        <Boton texto="Guardar récord" onPress={registrar} cargando={guardando} />
      </Tarjeta>

      <Text style={s.seccion}>Mis récords</Text>
      {records.length === 0 ? <Vacio texto="Aún no registraste récords." /> : records.map((r) => (
        <Tarjeta key={r.id}>
          <View style={s.fila2}>
            <Text style={s.logro}>{r.ejercicio}</Text>
            <Text style={s.peso}>{r.peso} kg</Text>
          </View>
          <Text style={s.etq}>{fechaCorta(`${r.fecha}T12:00:00`)}</Text>
        </Tarjeta>
      ))}
    </>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: 26, fontWeight: '800', color: C.texto, marginBottom: 14, marginTop: 8 },
  fila: { flexDirection: 'row', gap: 10 },
  fila2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dato: { flex: 1, backgroundColor: C.blanco, borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: C.borde, marginBottom: 10 },
  grande: { fontSize: 30, fontWeight: '800', color: C.texto },
  etq: { color: C.suave, fontSize: 13, marginTop: 2 },
  nota: { color: C.suave, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  logro: { fontWeight: '700', color: C.texto, fontSize: 16 },
  peso: { fontWeight: '800', color: C.primario, fontSize: 18 },
  fecha: { color: C.suave, fontSize: 12 },
  datos: { color: C.primario, fontWeight: '700', marginTop: 2 },
  desc: { color: '#374151', marginTop: 4 },
  seccion: { fontSize: 18, fontWeight: '800', color: C.texto, marginTop: 10, marginBottom: 8 },
});
