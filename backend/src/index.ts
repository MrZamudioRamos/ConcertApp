import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import concerts from './routes/concerts.js';
import favorites from './routes/favorites.js';
import { AppVariables } from './types/hono.js';

const app = new Hono<{ Variables: AppVariables }>();

app.use('*', cors());

app.get('/', (c) => c.json({ status: 'ConcertApp API running ✅' }));
app.route('/api/concerts', concerts);
app.route('/api/favorites', favorites); 

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
}, (info) => {
  console.log(`🚀 Backend corriendo en http://localhost:${info.port}`);
});
