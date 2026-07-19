import { createApp } from './app';
import { initDb } from './db';
import { env } from './env';

async function main(): Promise<void> {
  // Load persisted projects & numbers before serving (no-op without a DB).
  await initDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Fleetline API on :${env.port} (DATA_SOURCE=${env.dataSource})`);
  });
}

main().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});
