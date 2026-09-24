import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { TOKEN_KEY, api, registrarAlSesionExpirada } from '../api/client';
import { Usuario } from '../types';

export type { Usuario };

interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  registrar(nombre: string, correo: string, contrasena: string): Promise<void>;
  iniciarSesion(correo: string, contrasena: string): Promise<void>;
  cerrarSesion(): Promise<void>;
  /** Refleja en pantalla el usuario devuelto por el servidor (p. ej. tras editar el perfil). */
  actualizarUsuario(u: Usuario): void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  async function limpiarSesionLocal() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
    setUsuario(null);
  }

  // Sesión vencida / cerrada desde el servidor / cuenta suspendida -> vuelve al login automáticamente
  useEffect(() => {
    registrarAlSesionExpirada(() => { void limpiarSesionLocal(); });
    return () => registrarAlSesionExpirada(null);
  }, []);

  // HU-002 escenario 3 (sesión persistente): al abrir la app se restaura la sesión guardada.
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          const { data } = await api.get('/api/auth/me');
          setUsuario(data.usuario);
        }
      } catch {
        await limpiarSesionLocal(); // token vencido o inválido -> vuelve al login
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function guardarSesion(token: string, u: Usuario) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUsuario(u);
  }

  const registrar: AuthCtx['registrar'] = async (nombre, correo, contrasena) => {
    const { data } = await api.post('/api/auth/register', { nombre, correo, contrasena });
    await guardarSesion(data.token, data.usuario);
  };

  const iniciarSesion: AuthCtx['iniciarSesion'] = async (correo, contrasena) => {
    const { data } = await api.post('/api/auth/login', { correo, contrasena });
    await guardarSesion(data.token, data.usuario);
  };

  // HU-003: invalida la sesión en el servidor y elimina el token del dispositivo.
  // Si el servidor no responde, igual se cierra localmente (la sesión no queda abierta en el equipo).
  const cerrarSesion: AuthCtx['cerrarSesion'] = async () => {
    try {
      await api.post('/api/auth/logout', {}, { timeout: 5000 });
    } catch {
      // sin red: se continúa con el cierre local
    }
    await limpiarSesionLocal();
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, registrar, iniciarSesion, cerrarSesion, actualizarUsuario: setUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
