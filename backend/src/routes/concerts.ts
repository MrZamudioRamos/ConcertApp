import { Hono } from 'hono';
import axios from 'axios';

const concerts = new Hono();
const TM_KEY = process.env.TICKETMASTER_API_KEY;
const TM_URL = 'https://app.ticketmaster.com/discovery/v2';

// Buscar conciertos por artista o keyword
concerts.get('/search', async (c) => {
  const keyword = c.req.query('q');
  const countryCode = c.req.query('country') || 'MX,ES';

  if (!keyword) return c.json({ error: 'keyword requerido' }, 400);

  const res = await axios.get(`${TM_URL}/events.json`, {
    params: {
      keyword,
      classificationName: 'music',
      countryCode,
      apikey: TM_KEY,
      size: 20,
    },
  });

  const events = res.data._embedded?.events || [];

  const mapped = events.map((e: any) => ({
    id: e.id,
    name: e.name,
    date: e.dates?.start?.dateTime,
    venue: e._embedded?.venues?.[0]?.name,
    city: e._embedded?.venues?.[0]?.city?.name,
    country: e._embedded?.venues?.[0]?.country?.name,
    imageUrl: e.images?.[0]?.url,
    ticketUrl: e.url,
  }));

  return c.json(mapped);
});

export default concerts;
