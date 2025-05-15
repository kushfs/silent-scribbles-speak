
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { supabase as configuredSupabase } from '@/integrations/supabase/client';

// Use the already configured Supabase client from the integration
export const supabase = configuredSupabase;

// Export a typed version of the client for better type safety
export type Tables = Database['public']['Tables'];
export type Messages = Tables['messages']['Row'];
export type Conversations = Tables['conversations']['Row'];
export type ConversationParticipants = Tables['conversation_participants']['Row'];
export type Posts = Tables['posts']['Row'];
export type Comments = Tables['comments']['Row'];
export type Profiles = Tables['profiles']['Row'];
