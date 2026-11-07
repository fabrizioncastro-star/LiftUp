import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Pantalla } from '../components/Pantalla';
import { Boton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { NIVELES } from '../types';

const ETIQUETA_PRIVACIDAD = { publica: 'Pública', solo_amigos: 'Solo amigos', privada: 'Privada' };

export function PerfilScreen() {
  const nav = useNav();
  const { usuario, cerrarSesion } = useAuth();
  const [conteo, setConteo] = useState({ seguidores: 0, seguidos: 0, pendientes: 0 });

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      try {
        const [perfil, solicitudes] = await Promise.all([
          api.get(`/api/users/${usuario.id}`),
          api.get('/api/users/follow-requests'),
        ]);
        setConteo({ seguidores: perfil.data.seguidores, seguidos: perfil.data.seguidos, pendientes: solicitudes.data.solicitudes.length });
      } catch {
      }
    })();
  }, [usuario, nav.version]);

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
        <Text style={s.nivel}>{nivel}{usuario.rol === 'admin' ? ' · Administrador' : ''}</Text>
        {usuario.biografia ? <Text style={s.bio}>{usuario.biografia}</Text> : null}
        <View style={s.conteos}>
          <View style={s.conteo}><Text style={s.num}>{conteo.seguidores}</Text><Text style={s.etq}>Seguidores</Text></View>
          <View style={s.conteo}><Text style={s.num}>{conteo.seguidos}</Text><Text style={s.etq}>Siguiendo</Text></View>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Boton texto="Editar perfil" onPress={() => nav.push({ n: 'editarPerfil' })} />
        <Pressable style={s.fila} onPress={() => nav.push({ n: 'privacidad' })}>
          <Text style={s.filaTxt}>🔒 Privacidad de la cuenta</Text>
          <Text style={s.filaDer}>{ETIQUETA_PRIVACIDAD[usuario.privacidad ?? 'publica']} ›</Text>
        </Pressable>
        <Pressable style={s.fila} onPress={() => nav.push({ n: 'solicitudesSeguimiento' })}>
          <Text style={s.filaTxt}>👥 Solicitudes de seguimiento</Text>
          <Text style={[s.filaDer, conteo.pendientes > 0 && { color: C.peligro, fontWeight: '800' }]}>{conteo.pendientes > 0 ? `${conteo.pendientes} nueva(s)` : 'Ninguna'} ›</Text>
        </Pressable>
        {usuario.rol === 'admin' ? <Boton texto="🛡️ Panel de administración" variante="secundario" onPress={() => nav.push({ n: 'admin' })} /> : null}
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
  conteos: { flexDirection: 'row', gap: 40, marginTop: 14 },
  conteo: { alignItems: 'center' },
  num: { fontSize: 20, fontWeight: '800', color: C.texto },
  etq: { color: C.suave, fontSize: 12 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.blanco, borderRadius: 10, borderWidth: 1, borderColor: C.borde, padding: 14 },
  filaTxt: { color: C.texto, fontSize: 15, fontWeight: '600' },
  filaDer: { color: C.suave, fontSize: 14 },
});
