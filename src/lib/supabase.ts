import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { createDemoClient } from './demo';

// Mode démo : backend factice en mémoire (aucune config Supabase requise).
// Activé par EXPO_PUBLIC_DEMO=1 — pratique pour itérer sur l'UI.
export const IS_DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

function makeClient(): SupabaseClient {
  if (IS_DEMO) {
    return createDemoClient() as unknown as SupabaseClient;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Fail loud & early — a missing env is the #1 setup mistake.
    throw new Error(
      'Supabase non configuré. Copie .env.example vers .env et renseigne ' +
        'EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY ' +
        '(ou lance en mode démo avec EXPO_PUBLIC_DEMO=1).'
    );
  }

  // Client volontairement non typé par un schéma généré : les fonctions de
  // `queries.ts` annotent explicitement leurs types de retour (Profile, ScoreRow…),
  // ce qui donne des données typées côté app sans maintenir un schéma dupliqué.
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
}

export const supabase = makeClient();
