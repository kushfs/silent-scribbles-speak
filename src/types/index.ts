
export type User = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
};

export type PostType = 'text' | 'poll' | 'media';

export type Post = {
  id: string;
  title?: string;
  content: string;
  type: PostType;
  created_at: string;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
  has_commented?: boolean;
  media_url?: string;
  media_type?: string;
};

export type PollOption = {
  id: string;
  post_id: string;
  option_text: string;
  votes_count: number;
  has_voted?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  likes_count: number;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
};

export type Conversation = {
  id: string;
  participant_ids: string[];
  participant_usernames: string[];
  last_message?: ChatMessage;
  unread_count: number;
  created_at: string;
  updated_at: string;
};
