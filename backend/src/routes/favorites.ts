import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { AppVariables } from '../types/hono.js';

const favorites = new Hono<{ Variables: AppVariables }>();

favorites.use('*', authMiddleware);

// GET /api/favorites — listar conciertos guardados del usuario
favorites.get('/', async (c) => {
  const userId = c.get('user').id;

  const { data, error } = await supabase
    .from('saved_concerts')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// POST /api/favorites — guardar un concierto
favorites.post('/', async (c) => {
  const userId = c.get('user').id;
  const body = await c.req.json<{
    tm_id: string;
    name: string;
    date?: string;
    venue?: string;
    city?: string;
    image_url?: string;
    ticket_url?: string;
  }>();

  if (!body.tm_id || !body.name) {
    return c.json({ error: 'tm_id y name son requeridos' }, 400);
  }

  // Evitar duplicados
  const { data: existing } = await supabase
    .from('saved_concerts')
    .select('id')
    .eq('user_id', userId)
    .eq('tm_id', body.tm_id)
    .single();

  if (existing) {
    return c.json({ error: 'Ya guardado', already_saved: true }, 409);
  }

  const { data, error } = await supabase
    .from('saved_concerts')
    .insert({
      user_id: userId,
      tm_id: body.tm_id,
      name: body.name,
      date: body.date ?? null,
      venue: body.venue ?? null,
      city: body.city ?? null,
      image_url: body.image_url ?? null,
      ticket_url: body.ticket_url ?? null,
      saved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data, 201);
});

// DELETE /api/favorites/:tmId — eliminar por tm_id
favorites.delete('/:tmId', async (c) => {
  const userId = c.get('user').id;
  const tmId = c.req.param('tmId');

  const { error } = await supabase
    .from('saved_concerts')
    .delete()
    .eq('user_id', userId)
    .eq('tm_id', tmId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// GET /api/favorites/:tmId/check — comprobar si ya está guardado
favorites.get('/:tmId/check', async (c) => {
  const userId = c.get('user').id;
  const tmId = c.req.param('tmId');

  const { data } = await supabase
    .from('saved_concerts')
    .select('id')
    .eq('user_id', userId)
    .eq('tm_id', tmId)
    .single();

  return c.json({ saved: !!data });
});

export default favorites;
