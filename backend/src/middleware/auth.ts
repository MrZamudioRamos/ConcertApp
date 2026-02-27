import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';

const SUPABASE_JWKS = 'https://YOUR-PROJECT.supabase.co/auth/v1/jwks'; // ← cámbialo

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'No token' }, 401);

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!), // o usa JWKS para más seguridad
      { issuer: 'https://YOUR-PROJECT.supabase.co/auth/v1' }
    );

    c.set('user', { id: payload.sub }); // supabase user id
    await next();
  } catch (err) {
    return c.json({ error: 'Token inválido' }, 401);
  }
}