import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow the in-browser-loaded Google Fonts used by the prototype to keep working
  // until everything is migrated to next/font.
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
