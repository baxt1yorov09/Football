/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const nextConfig = {
  // ESLint uslub xatolari production build'ni bloklamasligi uchun.
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${API_URL}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
