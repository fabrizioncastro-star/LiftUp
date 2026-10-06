import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { api, mensajeDeError } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Campo } from '../components/Campo';
import { Pantalla } from '../components/Pantalla';
import { Boton, Encabezado, ErrorTexto } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { MedioElegido, archivoParaForm, elegirMedio } from '../media/seleccion';
import { useNav } from '../navigation/NavContext';
import { C } from '../theme';
import { NIVELES, Usuario } from '../types';

/** HU-004: editar foto (JPG/PNG), nombre, nivel de experiencia y biografía. */
export function EditarPerfilScreen() {
  const nav = useNav();
  const { usuario, actualizarUsuario } = useAuth();
  const u = usuario as Usuario;
  const [nombre, setNombre] = useState(u.nombre);
  const [nivel, setNivel] = useState<Usuario['nivelExperiencia']>(u.nivelExperiencia);
  const [bio, setBio] = useState(u.biografia ?? '');
  const [foto, setFoto] = useState<MedioElegido | null>(null);
  const [errorNombre, setErrorNombre] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function elegirFoto() {
    const r = await elegirMedio(true, 'Formato no permitido, usa JPG o PNG');
    if (!r) return;
    if ('error' in r) { setError(r.error); return; } // esc. 3: no actualiza la foto
    setError('');
    setFoto(r.medio);
  }

  async function guardar() {
    setError('');
    if (!nombre.trim()) { setErrorNombre('El nombre no puede estar vacío'); return; } // esc. 2
    setErrorNombre('');
    setGuardando(true);
    try {
      const form = new FormData();
      form.append('nombre', nombre.trim());
      form.append('nivelExperiencia', nivel);
      form.append('biografia', bio);
      if (foto) form.append('foto', archivoParaForm(foto));
      const { data } = await api.put('/api/users/profile', form, { timeout: 20000, headers: { 'Content-Type': 'multipart/form-data' } });
      actualizarUsuario(data.usuario);
      nav.pop();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Pantalla>
      <Encabezado titulo="Editar perfil" alVolver={nav.pop} />
      <View style={{ height: 16 }} />

      <Pressable style={s.fotoWrap} onPress={elegirFoto}>
        <Avatar nombre={nombre || '?'} foto={foto ? null : u.fotoPerfil} tam={96} />
        <Text style={s.cambiar}>{foto ? `Nueva foto: ${foto.nombre}` : 'Cambiar foto'}</Text>
      </Pressable>

      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} error={errorNombre} />

      <Text style={s.etiqueta}>Nivel de experiencia</Text>
      <View style={s.chips}>
        {NIVELES.map((n) => (
          <Pressable key={n.valor} style={[s.chip, nivel === n.valor && s.chipActivo]} onPress={() => setNivel(n.valor)}>
            <Text style={[s.chipTxt, nivel === n.valor && s.chipTxtActivo]}>{n.etiqueta}</Text>
          </Pressable>
        ))}
      </View>

      <Campo etiqueta="Biografía" value={bio} onChangeText={setBio} multiline maxLength={500} placeholder="Cuéntanos sobre ti" />
      <ErrorTexto texto={error} />
      <Boton texto="Guardar cambios" onPress={guardar} cargando={guardando} />
    </Pantalla>
  );
}

const s = StyleSheet.create({
  fotoWrap: { alignItems: 'center', marginBottom: 20 },
  cambiar: { color: C.primario, marginTop: 8, fontWeight: '600' },
  etiqueta: { fontSize: 14, fontWeight: '600', color: C.texto, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.blanco },
  chipActivo: { backgroundColor: C.primario, borderColor: C.primario },
  chipTxt: { color: '#374151' },
  chipTxtActivo: { color: '#fff', fontWeight: '700' },
});
