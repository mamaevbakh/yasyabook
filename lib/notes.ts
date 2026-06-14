import type { JSONContent } from "@tiptap/react";
import type { Note } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

const emptyDocument: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function toNote(row: {
  id: string;
  title: string;
  content: unknown;
  created_at: string;
  updated_at: string;
}): Note {
  return {
    ...row,
    content: row.content as JSONContent,
  };
}

export async function listNotes(): Promise<Note[]> {
  const { data, error } = await createClient()
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toNote);
}

export async function createNote(): Promise<Note> {
  const { data, error } = await createClient()
    .from("notes")
    .insert({ title: "", content: emptyDocument })
    .select()
    .single();

  if (error) throw error;
  return toNote(data);
}

export async function updateNote(
  id: string,
  values: { title: string; content: JSONContent },
): Promise<Note> {
  const { data, error } = await createClient()
    .from("notes")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return toNote(data);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await createClient().from("notes").delete().eq("id", id);
  if (error) throw error;
}
