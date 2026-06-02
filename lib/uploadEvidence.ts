import { supabase } from "./supabaseClient";

export async function uploadEvidence(file: File, incidentId: string) {
  const filePath = `${incidentId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("evidence")
    .upload(filePath, file);

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  return data.path;
}
