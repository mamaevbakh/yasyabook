import type { JSONContent } from "@tiptap/react";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Note = {
  id: string;
  title: string;
  content: JSONContent;
  created_at: string;
  updated_at: string;
};

export type Memory = {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          title: string;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          image_url: string;
          caption: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          caption?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          caption?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
