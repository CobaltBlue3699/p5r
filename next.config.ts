import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'patchwiki.biligame.com',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
