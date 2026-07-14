import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.*.*.*"],
  // add images support
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "iss.bfginternational.com",
        pathname: "**",
      },
      {
        protocol: "http",
        hostname: "intranet.bfginternational.com",
        port: "88",
        pathname: "/storage/**",
      },
    ],
  },
}

export default nextConfig
