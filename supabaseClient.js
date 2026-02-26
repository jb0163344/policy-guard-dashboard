import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sxvriggjkdseqahwdlws.supabase.co";
const SUPABASE_ANON_KEY = "PASTE_THE_PUBLISHABLE_ANON_KEY_HERE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
