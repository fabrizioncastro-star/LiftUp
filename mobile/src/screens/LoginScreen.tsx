import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { mensajeDeError } from '../api/client';
import { Campo } from '../components/Campo';
import { Pantalla } from '../components/Pantalla';
import { Boton, ErrorTexto } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

export function LoginScreen({ irARegistro, irARecuperar }: { irARegistro: () => void; irARecuperar: () => void }) {
  const { iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!correo.trim() || !contrasena) {
      setError('Correo y contraseña son obligatorios');
      return;
    }
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), contrasena);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Text style={s.titulo}>Bienvenido a LiftUp</Text>
      <Campo etiqueta="Correo" value={correo} onChangeText={setCorreo} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Campo etiqueta="Contraseña" value={contrasena} onChangeText={setContrasena} secureTextEntry />
      <ErrorTexto texto={error} />
      <Boton texto="Iniciar Sesión" onPress={enviar} cargando={enviando} />
      <Pressable onPress={irARecuperar}><Text style={s.link}>¿Olvidaste tu contraseña?</Text></Pressable>
      <Pressable onPress={irARegistro}><Text style={s.link}>¿No tienes cuenta? Regístrate</Text></Pressable>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: 28, fontWeight: '800', color: C.texto, marginBottom: 24, marginTop: 48 },
  link: { color: C.primario, textAlign: 'center', marginTop: 20 },
});
