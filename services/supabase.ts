import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SUPABASE_URL = "https://fzunltlctxobsivpdzxf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dW5sdGxjdHhvYnNpdnBkenhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjM3MzAsImV4cCI6MjA4NzMzOTczMH0.ZjrjI1PZqANV2ZlQF51VUnnMSMcN0NVuWa11NKzF-wQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
