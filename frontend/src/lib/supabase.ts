import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';
import { env, isSupabaseConfigured } from './env';

/**
 * The client is created even when env vars are missing so the UI can render a
 * helpful configuration screen instead of crashing at import time.
 */
export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': 'muse-web',
      },
    },
  },
);

export { isSupabaseConfigured };
