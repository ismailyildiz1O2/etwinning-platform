import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Remove these before production deployment.
  // They suppress TypeScript and ESLint errors during build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
