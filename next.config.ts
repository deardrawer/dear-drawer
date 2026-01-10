import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages optimization
  images: {
    unoptimized: true,
  },
  // Enable experimental features for edge runtime
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
