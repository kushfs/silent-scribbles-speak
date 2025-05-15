
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// These will be replaced with the actual Supabase URL and anon key after Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase credentials are missing. Please connect your project to Supabase by clicking the green Supabase button in the top right corner.'
  );
}

// Create a mock client if credentials are missing to prevent app from crashing
const createSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  // Return a mock client that doesn't throw errors but logs warnings
  return {
    from: () => ({
      select: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: null, error: new Error('Supabase not connected') };
      },
      insert: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: null, error: new Error('Supabase not connected') };
      },
      update: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: null, error: new Error('Supabase not connected') };
      },
      delete: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: null, error: new Error('Supabase not connected') };
      },
      upsert: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: null, error: new Error('Supabase not connected') };
      },
      eq: () => ({
        select: () => {
          console.warn('Supabase not connected. Please connect your project to Supabase.');
          return { data: null, error: new Error('Supabase not connected') };
        }
      }),
    }),
    auth: {
      signUp: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: null, error: new Error('Supabase not connected') };
      },
      signIn: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: null, error: new Error('Supabase not connected') };
      },
      signOut: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: null, error: new Error('Supabase not connected') };
      },
      onAuthStateChange: () => {
        console.warn('Supabase not connected. Please connect your project to Supabase.');
        return { data: { subscription: { unsubscribe: () => {} } }, error: null };
      }
    },
    storage: {
      from: () => ({
        upload: () => {
          console.warn('Supabase not connected. Please connect your project to Supabase.');
          return { data: null, error: new Error('Supabase not connected') };
        }
      })
    },
    channel: () => ({
      on: () => ({
        subscribe: () => {
          console.warn('Supabase not connected. Please connect your project to Supabase.');
          return {};
        }
      })
    }),
    removeChannel: () => {
      console.warn('Supabase not connected. Please connect your project to Supabase.');
      return true;
    }
  } as any;
};

export const supabase = createSupabaseClient();
