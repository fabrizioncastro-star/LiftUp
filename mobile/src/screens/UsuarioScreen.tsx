import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Avatar } from '../components/Avatar';
import { MenuOpciones } from '../components/MenuOpciones';
import { Pantalla } from '../components/Pantalla';
import { PostCard } from '../components/PostCard';
import { ReportarMenu, enviarReporte } from '../components/Reportar';
import { Boton, Encabezado, ErrorTexto, Vacio } from '../components/ui';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { NIVELES, PerfilPublico } from '../types';

const TEXTO_PRIVACIDAD = {
  privada: 'Esta cuenta es privada. Envía una solicitud para ver sus publicaciones.',
  solo_amigos: 'Esta cuenta es solo para amigos. Sigue a esta persona y espera que te siga de vuelta para ver su contenido.',
  publica: '',
};

export function UsuarioScreen({ id }: { id: number }) {
  const nav = useNav();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [menu, setMenu] = useState(false);
  const [motivos, setMotivos] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/users/${id}`);
      setPerfil(data);
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }, [id]);

  useEffect(() => { void cargar(); }, [cargar]);

  async function seguir() {
    setOcupado(true);
    try {
      await api.post(`/api/users/${id}/follow`, {}, { timeout: 5000 });
      await cargar();
      nav.refrescar();
    } catch (err) {
      Alert.alert('No se pudo seguir', mensajeDeError(err));
    } finally {
      setOcupado(false);
    }
  }

  function confirmarDejarDeSeguir() {
    const pendiente = perfil?.relacion === 'pendiente';
    Alert.alert(pendiente ? 'Cancelar solicitud' : 'Dejar de seguir', pendiente ? '¿Cancelar tu solicitud de seguimiento?' : `¿Dejar de seguir a ${perfil?.usuario.nombre}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí', style: 'destructive',
        onPress: async () => {
          setOcupado(true);
          try {
            await api.delete(`/api/users/${id}/follow`);
            await cargar();
            nav.refrescar();
          } catch (err) {
            Alert.alert('Error', mensajeDeError(err));
          } finally {
            setOcupado(false);
          }
        },
      },
    ]);
  }

  const encabezado = <Encabezado titulo={perfil?.usuario.nombre ?? 'Perfil'} alVolver={nav.pop} derecha={perfil && perfil.relacion !== 'yo' ? (
    <Pressable onPress={() => setMenu(true)} hitSlop={10}><Text style={s.puntos}>•••</Text></Pressable>
  ) : undefined} />;

  if (!perfil) {
    return (
      <Pantalla scroll={false}>
        {encabezado}
        {error ? <View style={{ padding: 20 }}><ErrorTexto texto={error} /></View> : <ActivityIndicator style={{ marginTop: 40 }} />}
      </Pantalla>
    );
  }

  const u = perfil.usuario;
  const nivel = NIVELES.find((n) => n.valor === u.nivelExperiencia)?.etiqueta;

  const cabecera = (
    <View style={s.cabecera}>
      <View style={{ alignItems: 'center' }}><Avatar nombre={u.nombre} foto={u.fotoPerfil} tam={88} /></View>
      <Text style={s.nombre}>{u.nombre}</Text>
      <Text style={s.nivel}>{nivel}{perfil.teSigue ? ' · Te sigue' : ''}</Text>
      {u.biografia ? <Text style={s.bio}>{u.biografia}</Text> : null}
      <View style={s.conteos}>
        <View style={s.conteo}><Text style={s.num}>{perfil.seguidores}</Text><Text style={s.etq}>Seguidores</Text></View>
        <View style={s.conteo}><Text style={s.num}>{perfil.seguidos}</Text><Text style={s.etq}>Siguiendo</Text></View>
      </View>
      {perfil.relacion === 'ninguna' && <Boton texto="Seguir" onPress={seguir} cargando={ocupado} />}
      {perfil.relacion === 'pendiente' && <Boton texto="Solicitud enviada · Cancelar" variante="secundario" onPress={confirmarDejarDeSeguir} cargando={ocupado} />}
      {perfil.relacion === 'siguiendo' && <Boton texto="Siguiendo ✓" variante="secundario" onPress={confirmarDejarDeSeguir} cargando={ocupado} />}
    </View>
  );

  return (
    <Pantalla scroll={false}>
      {encabezado}
      <FlatList
        data={perfil.puedeVerContenido ? perfil.publicaciones : []}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => <PostCard item={item} />}
        ListHeaderComponent={cabecera}
        ListEmptyComponent={perfil.puedeVerContenido
          ? <Vacio texto="Aún no hay publicaciones." />
          : <Vacio texto={`🔒 ${TEXTO_PRIVACIDAD[u.privacidad]}`} />}
      />
      <MenuOpciones visible={menu} onCerrar={() => setMenu(false)} opciones={[{ etiqueta: 'Reportar usuario', peligro: true, onPress: () => setMotivos(true) }]} />
      <ReportarMenu visible={motivos} onCerrar={() => setMotivos(false)} onElegir={(m) => void enviarReporte('usuarios', id, m)} />
    </Pantalla>
  );
}

const s = StyleSheet.create({
  cabecera: { alignItems: 'stretch', padding: 20, backgroundColor: C.blanco, marginBottom: 12, gap: 10 },
  nombre: { fontSize: 24, fontWeight: '800', color: C.texto, textAlign: 'center', marginTop: 6 },
  nivel: { color: C.primario, fontWeight: '700', textAlign: 'center' },
  bio: { color: '#374151', textAlign: 'center', lineHeight: 20 },
  conteos: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginVertical: 8 },
  conteo: { alignItems: 'center' },
  num: { fontSize: 20, fontWeight: '800', color: C.texto },
  etq: { color: C.suave, fontSize: 12 },
  puntos: { color: C.suave, fontSize: 18, letterSpacing: 1 },
});
