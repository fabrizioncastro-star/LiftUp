import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Pantalla } from '../components/Pantalla';
import { Boton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { NIVELES } from '../types';

export function PerfilScreen() {
  const nav = useNav();
  const { usuario, cerrarSesion } = useAuth();
  if (!usuario) return null;
  const nivel = NIVELES.find((n) => n.valor === usuario.nivelExperiencia)?.etiqueta;

  function confirmarCierre() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void cerrarSesion() },
    ]);
  }

  return (
    <Pantalla>
      <View style={s.centro}>
        <Avatar nombre={usuario.nombre} foto={usuario.fotoPerfil} tam={96} />
        <Text style={s.nombre}>{usuario.nombre}</Text>
        <Text style={s.correo}>{usuario.correo}</Text>
        <Text style={s.nivel}>{nivel}</Text>
        {usuario.biografia ? <Text style={s.bio}>{usuario.biografia}</Text> : null}
      </View>

      <View style={{ gap: 10 }}>
        <Boton texto="Editar perfil" onPress={() => nav.push({ n: 'editarPerfil' })} />
        <Boton texto="Cerrar sesión" variante="peligro" onPress={confirmarCierre} />
      </View>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  centro: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  nombre: { fontSize: 24, fontWeight: '800', color: C.texto, marginTop: 12 },
  correo: { color: C.suave, marginTop: 2 },
  nivel: { color: C.primario, fontWeight: '700', marginTop: 8 },
  bio: { color: '#374151', marginTop: 12, textAlign: 'center', lineHeight: 20 },
});
