import { crearApp } from './app';
import { env } from './config/env';
import { migrar } from './config/migrar';

async function iniciar(): Promise<void> {
  await migrar();
  crearApp().listen(env.port, () => console.log(`LiftUp API en puerto ${env.port}`));
}

iniciar().catch((err) => {
  console.error('[LiftUp] No se pudo iniciar:', err);
  process.exit(1);
});
