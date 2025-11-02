import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/sg-public/**", // senin public path’ine göre
      },
    ],
  },
};

export default nextConfig;
