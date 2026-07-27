import type { MetadataRoute } from 'next';
import { absoluteUrl, UNPREFIXED_ROUTES } from '@/lib/routes';

/**
 * Die App-Routen sind zwar erreichbar, gehören aber nicht in den Index: /dashboard und
 * /profil zeigen kontoabhängige Inhalte, /auth und /join sind Einweg-Links aus E-Mails.
 * Sie tragen zusätzlich `noindex` — robots.txt allein verhindert Indexierung nicht,
 * sondern nur das Crawlen.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...UNPREFIXED_ROUTES.filter((r) => r !== '/impressum' && r !== '/datenschutz'), '/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
