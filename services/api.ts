import axios from 'axios';

const API_URL = 'http://10.0.2.2:3000'; // 10.0.2.2 = localhost desde el emulador Android

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const searchConcerts = async (query: string, country = 'ES') => {
  const res = await api.get('/api/concerts/search', {
    params: { q: query, country },
  });
  return res.data;
};

export const getConcertById = async (id: string) => {
  const res = await api.get(`/api/concerts/${id}`);
  return res.data;
};
