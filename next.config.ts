import { brand } from "@/lib/brand";
import { supabasePublicDefaults } from "@/lib/supabase/public-config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: brand.name,
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || supabasePublicDefaults.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabasePublicDefaults.anonKey,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://animivo.app",
  },
};

export default nextConfig;
