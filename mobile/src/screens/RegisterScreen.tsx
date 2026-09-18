import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { mensajeDeError } from '../api/client';
import { Campo } from '../components/Campo';
import { Pantalla } from '../components/Pantalla';
import { Boton, ErrorTexto } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';
import { ErroresRegistro, validarRegistro } from '../validation/registro';

export function RegisterScreen({ irALogin }: { irALogin: () => void }) {
  const { registrar } = useAuth();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    const e = validarRegistro(nombre, correo, contrasena);
    setErrores(e);
    setErrorServidor('');
    if (Object.keys(e).length > 0) return;
    setEnviando(true);
    try {
      await registrar(nombre.trim(), correo.trim(), contrasena);
    } catch (err) {
      setErrorServidor(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Text style={s.titulo}>Crea tu cuenta</Text>
      <Text style={s.sub}>Tu progreso, a tu ritmo.</Text>

      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} error={errores.nombre} placeholder="Tu nombre" autoComplete="name" />
      <Campo
        etiqueta="Correo" value={correo} onChangeText={setCorreo} error={errores.correo}
        placeholder="correo@ejemplo.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email"
      />
      <Campo
        etiqueta="Contraseña" value={contrasena} onChangeText={setContrasena} error={errores.contrasena}
        placeholder="Mínimo 8 caracteres" secureTextEntry
      />
      <ErrorTexto texto={errorServidor} />

      <Boton texto="Registrarme" onPress={enviar} cargando={enviando} />
      <Pressable onPress={irALogin}><Text style={s.link}>¿Ya tienes cuenta? Inicia sesión</Text></Pressable>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: 28, fontWeight: '800', color: C.texto, marginTop: 24 },
  sub: { color: C.suave, marginBottom: 24, marginTop: 4 },
  link: { color: C.primario, textAlign: 'center', marginTop: 20 },
});
