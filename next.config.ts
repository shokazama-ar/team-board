import type { NextConfig } from "next";

const devHost = process.env.DEV_HOST;

const nextConfig: NextConfig = {
  allowedDevOrigins: devHost ? [devHost] : [],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      ...(devHost
        ? [
            {
              protocol: "http" as const,
              hostname: devHost,
              port: "54321",
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
