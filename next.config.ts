import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://172.18.1.140:4000",
    "http://localhost:4000",
    "172.18.1.140",
  ],
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
