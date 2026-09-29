export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRow = {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

export type NotebookRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type NoteRow = {
  id: string;
  user_id: string;
  notebook_id: string | null;
  title: string;
  content: Json;
  plain_text: string;
  is_pinned: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteSummary = Omit<NoteRow, 'content'>;

export type NoteVersionRow = {
  id: string;
  note_id: string;
  user_id: string;
  title: string;
  content: Json;
  version_number: number;
  created_at: string;
};

export type TagRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type NoteTagRow = {
  note_id: string;
  tag_id: string;
  user_id: string;
};

type NoteInsert = {
  id?: string;
  user_id: string;
  notebook_id?: string | null;
  title?: string;
  content?: Json;
  plain_text?: string;
  is_pinned?: boolean;
  trashed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type NoteUpdate = {
  notebook_id?: string | null;
  title?: string;
  content?: Json;
  plain_text?: string;
  is_pinned?: boolean;
  trashed_at?: string | null;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notebooks: {
        Row: NotebookRow;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: NoteRow & { search_vector: unknown };
        Insert: NoteInsert;
        Update: NoteUpdate;
        Relationships: [];
      };
      note_versions: {
        Row: NoteVersionRow;
        Insert: {
          id?: string;
          note_id: string;
          user_id: string;
          title: string;
          content: Json;
          version_number: number;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      note_tags: {
        Row: NoteTagRow;
        Insert: NoteTagRow;
        Update: Partial<NoteTagRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      checkpoint_note: {
        Args: { p_note_id: string };
        Returns: NoteVersionRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
