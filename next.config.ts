import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['axios'],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
