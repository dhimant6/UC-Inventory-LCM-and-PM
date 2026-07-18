import { createApp } from './app';
import { env } from './env';

const app = createApp();

app.listen(env.port, () => {
  console.log(`UC Inventory API on :${env.port} (DATA_SOURCE=${env.dataSource})`);
});
