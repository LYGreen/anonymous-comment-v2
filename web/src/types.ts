export interface Comment {
  id: number;
  user_id: string;
  content?: string;
  image_url?: string;
  quote_id: number | null;
  created_at: string;
  role: 'admin' | 'user';
}

export interface VComment extends Comment { 
  quoted_user_id?: string; 
  quoted_content?: string;
  quoted_image_url?: string;
  quoted_created_at?: string;
  quoted_quoted_id?: number;
  quoted_role?: 'user' | 'admin';
}
