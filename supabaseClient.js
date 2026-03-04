import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// IMPORTANT: Avoid server-side build/prerender crash
export const supabase =
  typeof window === "undefined" || !url || !key ? null : createClient(url, key);
