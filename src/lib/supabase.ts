import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Lazy initialization to prevent crash if env vars are missing
let supabaseInstance: SupabaseClient<Database> | null = null;

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get: (_target, prop) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      // Return a dummy object for auth to allow the login screen to render
      // but throw on actual data operations
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithOAuth: () => {
            alert('Supabase URL and Anon Key are required. Please configure them in the Secrets panel.');
            return Promise.resolve({ data: {}, error: null });
          },
          signOut: () => Promise.resolve({ error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
        };
      }
      throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel.');
    }
    
    if (!supabaseInstance) {
      supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return (supabaseInstance as any)[prop];
  }
});
