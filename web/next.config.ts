import type { NextConfig } from "next";

const backendUrl = process.env.SPRING_API_URL || "http://localhost:8080";
const nextConfig: NextConfig = {
  // WŁĄCZENIE FUNKCJI FORBIDDEN() I UNAUTHORIZED()
  experimental: {
    authInterrupts: true,
  },
  // Backend Spring API proxy — brak potrzeby CORS w przeglądarce
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
