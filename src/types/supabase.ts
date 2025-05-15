
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string | null
          content: string
          type: string
          media_url: string | null
          media_type: string | null
          likes_count: number
          comments_count: number
          created_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          content: string
          type: string
          media_url?: string | null
          media_type?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          content?: string
          type?: string
          media_url?: string | null
          media_type?: string | null
          likes_count?: number
          comments_count?: number
          created_at?: string
        }
      }
      poll_options: {
        Row: {
          id: string
          post_id: string
          option_text: string
          votes_count: number
        }
        Insert: {
          id?: string
          post_id: string
          option_text: string
          votes_count?: number
        }
        Update: {
          id?: string
          post_id?: string
          option_text?: string
          votes_count?: number
        }
      }
      poll_votes: {
        Row: {
          id: string
          poll_option_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          poll_option_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          poll_option_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          likes_count: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          likes_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          likes_count?: number
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          read?: boolean
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          read?: boolean
        }
      }
    }
  }
}
