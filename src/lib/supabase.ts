
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { supabase as configuredSupabase } from '@/integrations/supabase/client';

// Use the already configured Supabase client from the integration
export const supabase = configuredSupabase;
