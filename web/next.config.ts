import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// ESM doesn't define __dirname — derive it manually so Turbopack can pin
// its workspace root to this Next.js project. Without this pin the
// sibling ../app/ legacy HTML prototype folder hijacks the root.
const here = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: here,
  },
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
