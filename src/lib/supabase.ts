import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loud & early — a missing env is the #1 setup mistake.
  throw new Error(
    'Supabase non configuré. Copie .env.example vers .env et renseigne ' +
      'EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Client volontairement non typé par un schéma généré : les fonctions de
// `queries.ts` annotent explicitement leurs types de retour (Profile, ScoreRow…),
// ce qui donne des données typées côté app sans maintenir un schéma dupliqué.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage marche partout (natif + web). Sur web SSR il n'y a pas de
    // window, on laisse Supabase gérer localStorage.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
