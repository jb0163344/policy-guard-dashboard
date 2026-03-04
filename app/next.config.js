/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://sxvriggjkdseqahwdlws.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "PASTE_YOUR_PUBLISHABLE_KEY_HERE"
  },
};

module.exports = nextConfig;
