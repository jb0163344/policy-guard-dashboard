/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://sxvriggjkdseqahwdlws.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_ymwuEpkN-0GtSLy4WxQBaQ_fR7-wpzG"
  },
};

module.exports = nextConfig;
