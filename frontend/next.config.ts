import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
    "0.0.0.0",
    "0.0.0.0:3000",
    "192.168.1.8",
    "192.168.1.8:3000",
    ...Array.from({ length: 255 }, (unusedItem, i) => `192.168.1.${i + 1}`),
    ...Array.from({ length: 255 }, (unusedItem, i) => `192.168.0.${i + 1}`),
    ...Array.from({ length: 255 }, (unusedItem, i) => `10.0.0.${i + 1}`),
  ],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
