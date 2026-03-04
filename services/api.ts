// ✅ services/api.ts
import Constants from "expo-constants";
import axios from "axios";
import { supabase } from "./supabase";

const getApiUrl = () => {
  // En producción, usa tu URL de servidor real
  if (process.env.NODE_ENV === "production")
    return "https://tu-backend.railway.app";

  // En desarrollo, detecta la IP del host desde Expo
  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (debuggerHost) return `http://${debuggerHost}:3000`;

  // Fallback Android emulator
  return "http://10.0.2.2:3000";
};

export const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const searchConcerts = async (query: string, country = "ES") => {
  const res = await api.get("/api/concerts/search", {
    params: { q: query, country },
  });
  return res.data;
};

export const getConcertById = async (id: string) => {
  const res = await api.get(`/api/concerts/${id}`);
  return res.data;
};

export const getFavorites = async () => {
  const res = await api.get("/api/favorites");
  return res.data;
};

export const saveConcert = async (concert: {
  tm_id: string;
  name: string;
  date?: string;
  venue?: string;
  city?: string;
  image_url?: string;
  ticket_url?: string;
}) => {
  const res = await api.post("/api/favorites", concert);
  return res.data;
};

export const deleteFavorite = async (tmId: string) => {
  const res = await api.delete(`/api/favorites/${tmId}`);
  return res.data;
};

export const checkFavorite = async (tmId: string): Promise<boolean> => {
  const res = await api.get(`/api/favorites/${tmId}/check`);
  return res.data.saved;
};
