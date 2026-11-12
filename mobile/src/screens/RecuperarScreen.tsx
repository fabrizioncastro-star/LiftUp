import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Campo } from '../components/Campo';
import { Pantalla } from '../components/Pantalla';
import { Boton, ErrorTexto } from '../components/ui';
import { C } from '../theme';

type Paso = 'correo' | 'codigo' | 'nueva' | 'listo';

export function RecuperarScreen({ alTerminar }: { alTerminar: () => void }) {
  const [paso, setPaso] = useState<Paso>('correo');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function llamar(fn: () => Promise<void>) {
    setError('');
    setOcupado(true);
    try {
      await fn();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setOcupado(false);
    }
  }

  const enviarCodigo = () => llamar(async () => {
    if (!correo.trim()) { setError('Ingresa tu correo'); return; }
    await api.post('/api/auth/forgot-password', { correo: correo.trim() }, { timeout: 20000 });
    setPaso('codigo');
  });

  const verificar = () => llamar(async () => {
    if (codigo.trim().length !== 6) { setError('El código tiene 6 dígitos'); return; }
    await api.post('/api/auth/verify-code', { correo: correo.trim(), codigo: codigo.trim() });
    setPaso('nueva');
  });

  const cambiar = () => llamar(async () => {
    if (nueva.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    await api.post('/api/auth/reset-password', { correo: correo.trim(), codigo: codigo.trim(), nuevaContrasena: nueva });
    setPaso('listo');
  });

  return (
    <Pantalla>
      <Pressable onPress={alTerminar} hitSlop={10}><Text style={s.volver}>‹ Volver al inicio de sesión</Text></Pressable>
      <Text style={s.titulo}>Recuperar contraseña</Text>

      {paso === 'correo' && (
        <>
          <Text style={s.sub}>Escribe el correo de tu cuenta y te enviaremos un código de 6 dígitos.</Text>
          <Campo etiqueta="Correo" value={correo} onChangeText={setCorreo} autoCapitalize="none" keyboardType="email-address" />
          <ErrorTexto texto={error} />
          <Boton texto="Enviar código" onPress={enviarCodigo} cargando={ocupado} />
        </>
      )}

      {paso === 'codigo' && (
        <>
          <Text style={s.sub}>Enviamos un código a {correo.trim()}. Vence en 10 minutos.</Text>
          <Campo etiqueta="Código" value={codigo} onChangeText={(t) => setCodigo(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="000000" />
          <ErrorTexto texto={error} />
          <Boton texto="Verificar código" onPress={verificar} cargando={ocupado} />
          <Pressable onPress={() => { setPaso('correo'); setError(''); }}><Text style={s.link}>Pedir un código nuevo</Text></Pressable>
        </>
      )}

      {paso === 'nueva' && (
        <>
          <Text style={s.sub}>Define tu nueva contraseña (mínimo 8 caracteres).</Text>
          <Campo etiqueta="Nueva contraseña" value={nueva} onChangeText={setNueva} secureTextEntry />
          <Campo etiqueta="Confirmar contraseña" value={confirmar} onChangeText={setConfirmar} secureTextEntry />
          <ErrorTexto texto={error} />
          <Boton texto="Cambiar contraseña" onPress={cambiar} cargando={ocupado} />
        </>
      )}

      {paso === 'listo' && (
        <>
          <Text style={s.ok}>¡Listo! Tu contraseña fue actualizada.</Text>
          <Text style={s.sub}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
          <Boton texto="Ir a iniciar sesión" onPress={alTerminar} />
        </>
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  volver: { color: C.primario, fontWeight: '600', marginTop: 8 },
  titulo: { fontSize: 26, fontWeight: '800', color: C.texto, marginTop: 20, marginBottom: 8 },
  sub: { color: C.suave, marginBottom: 20, lineHeight: 20 },
  ok: { color: C.ok, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  link: { color: C.primario, textAlign: 'center', marginTop: 20 },
});
