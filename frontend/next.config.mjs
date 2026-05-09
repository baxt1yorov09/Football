/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force HTTP in development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
  // Disable HTTPS redirect
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: '', // Disable HSTS in dev
          },
        ],
      },
    ];
  },
};

export default nextConfig;
