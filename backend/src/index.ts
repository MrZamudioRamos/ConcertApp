import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import concerts from './routes/concerts';

const app = new Hono();

app.use('*', cors());

app.get('/', (c) => c.json({ status: 'ConcertApp API running ✅' }));
app.route('/api/concerts', concerts);

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
}, (info) => {
  console.log(`🚀 Backend corriendo en http://localhost:${info.port}`);
});
