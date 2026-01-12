import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// 로컬 개발 환경에서 Cloudflare 바인딩 초기화
initOpenNextCloudflareForDev();

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
