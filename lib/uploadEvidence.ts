import { supabase } from "./supabaseClient";

export async function uploadEvidence(file: File, incidentId: string) {
  const filePath = `${incidentId}/${Date.now()}-${file.name}`;

  // 1. Upload file to storage bucket
  const { data, error } = await supabase.storage
    .from("evidence")
    .upload(filePath, file);

  if (error) {
    console.error("Upload failed:", error.message);
    return null;
  }

  // 2. Save reference in database (evidence_packs table)
  const { error: dbError } = await supabase
    .from("evidence_packs")
    .insert({
      incident_id: incidentId,
      evidence_name: file.name,
      evidence_hash: data.path,
      source: "user_upload",
    });

  if (dbError) {
    console.error("DB insert failed:", dbError.message);
  }

  return data.path;
}
