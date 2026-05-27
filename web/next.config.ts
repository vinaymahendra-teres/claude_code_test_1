import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // next/image transcodes uploads to AVIF/WebP and ships responsive
  // srcsets — a 4 MB Supabase Storage upload is delivered to a phone as a
  // ~30-80 KB AVIF. remotePatterns authorises the Supabase Storage host
  // so attachment thumbnails can use next/image too.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
