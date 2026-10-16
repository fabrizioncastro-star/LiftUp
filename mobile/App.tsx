import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { C } from './src/theme';

type Pantalla = 'registro' | 'login';

function Raiz() {
  const { usuario, cargando } = useAuth();
  const [pantalla, setPantalla] = useState<Pantalla>('registro');
  const huboSesion = useRef(false);

  useEffect(() => {
    if (usuario) huboSesion.current = true;
    else if (huboSesion.current) {
      huboSesion.current = false;
      setPantalla('login');
    }
  }, [usuario]);

  if (cargando) {
    return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.fondo }}><ActivityIndicator size="large" /></View>;
  }
  if (usuario) return <HomeScreen />;
  return pantalla === 'registro'
    ? <RegisterScreen irALogin={() => setPantalla('login')} />
    : <LoginScreen irARegistro={() => setPantalla('registro')} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Raiz />
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
