import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
        pathname: "**",
      },
    ],
  },
}

export default nextConfig
