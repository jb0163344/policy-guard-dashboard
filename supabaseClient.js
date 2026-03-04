import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sxvriggjkdseqahwdlws.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ymwuEpkN-0GtSLy4WxQBaQ_fR7-wpzG";

// Prevent server-side build from crashing
export const supabase =
  typeof window === "undefined"
    ? null
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
