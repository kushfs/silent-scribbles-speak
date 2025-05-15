
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// These will be replaced with the actual Supabase URL and anon key after Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
