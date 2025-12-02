import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingIncludes: {
    '/': ['./lib/data/**/*'],
    '/results': ['./lib/data/**/*'],
    '/minor-details/**/*': ['./lib/data/**/*'],
    '/api/**/*': ['./lib/data/**/*'],
  },
};

export default nextConfig;
