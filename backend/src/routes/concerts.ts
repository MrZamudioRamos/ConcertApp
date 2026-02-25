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

// Obtener concierto por ID
concerts.get('/:id', async (c) => {
  const id = c.req.param('id');

  const res = await axios.get(`${TM_URL}/events/${id}.json`, {
    params: { apikey: TM_KEY },
  });

  const e = res.data;

  return c.json({
    id: e.id,
    name: e.name,
    date: e.dates?.start?.localDate,
    time: e.dates?.start?.localTime?.slice(0, 5),
    venue: e._embedded?.venues?.[0]?.name,
    city: e._embedded?.venues?.[0]?.city?.name,
    country: e._embedded?.venues?.[0]?.country?.name,
    imageUrl: e.images?.sort((a: any, b: any) => b.width - a.width)
                        .find((img: any) => img.ratio === '16_9')?.url
              ?? e.images?.[0]?.url,
    ticketUrl: e.url,
    genre: e.classifications?.[0]?.genre?.name,
    segment: e.classifications?.[0]?.segment?.name,
    artists: e._embedded?.attractions?.map((a: any) => ({
      id: a.id,
      name: a.name,
      imageUrl: a.images?.[0]?.url,
    })) ?? [],
    priceMin: e.priceRanges?.[0]?.min,
    priceMax: e.priceRanges?.[0]?.max,
  });
});



export default concerts;
