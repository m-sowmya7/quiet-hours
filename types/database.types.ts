export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      blocks: {
        Row: {
          id: string;
          user_id: string;
          user_email: string | null;
          title: string | null;
          start_time: string;
          end_time: string;
          notified: boolean | null;
          notified_at: string | null;
          email_sent: boolean | null;
          email_sent_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email?: string | null;
          title?: string | null;
          start_time: string;
          end_time: string;
          notified?: boolean | null;
          notified_at?: string | null;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_email?: string | null;
          title?: string | null;
          start_time?: string;
          end_time?: string;
          notified?: boolean | null;
          notified_at?: string | null;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          created_at?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
  };
};