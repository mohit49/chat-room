import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flipychat.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/privacy-policy', '/login'],
        disallow: ['/home', '/profile', '/rooms', '/notifications', '/users', '/api/', '/instant-chat', '/random-connect'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

