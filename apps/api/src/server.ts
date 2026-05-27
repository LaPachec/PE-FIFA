import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../../.env') });
config();

const { app } = await import('./app.js');

const port = Number(process.env.PORT ?? 3333);

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
