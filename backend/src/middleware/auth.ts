import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import type { AppVariables } from '../types/hono.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

export async function authMiddleware(
  c: Context<{ Variables: AppVariables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'No autorizado' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    c.set('user', { id: payload.sub as string });
    await next();
  } catch {
    return c.json({ error: 'Token inválido' }, 401);
  }
}
