import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api/', '/settings', '/profile'],
      },
    ],
    sitemap: 'https://fmtmufa.uz/sitemap.xml',
  };
}
