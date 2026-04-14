import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backend Spring API proxy — brak potrzeby CORS w przeglądarce
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
