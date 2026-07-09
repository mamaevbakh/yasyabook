import type { Memory } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "memories";

export async function listMemories(): Promise<Memory[]> {
  const { data, error } = await createClient()
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function uploadMemory(
  file: File,
  caption: string,
): Promise<Memory> {
  const supabase = createClient();
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file);
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("memories")
    .insert({ image_url: publicUrl, caption })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await createClient().from("memories").delete().eq("id", id);
  if (error) throw error;
}
