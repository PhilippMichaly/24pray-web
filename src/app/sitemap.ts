import type { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { absoluteUrl, alternatesFor, landingPath, projectPath, sectionPath } from '@/lib/routes';
import { fetchPublicProjects } from '@/lib/api-server';

/** Stündlich neu erzeugen: neue Wachen sollen zeitnah auffindbar sein, ohne dass jeder
 *  Crawler-Besuch die API trifft. */
export const revalidate = 3600;

/** Sitemaps dürfen 50.000 URLs fassen. Bei 5 Sprachen je Wache ist das die Grenze in Wachen. */
const MAX_PROJECTS = Math.floor(50_000 / SUPPORTED_LOCALES.length) - 10;

function entry(pathFor: (l: (typeof SUPPORTED_LOCALES)[number]) => string, lastModified?: Date) {
  return SUPPORTED_LOCALES.map((locale) => ({
    url: absoluteUrl(pathFor(locale)),
    lastModified,
    alternates: { languages: alternatesFor(locale, pathFor).languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await fetchPublicProjects();
  const listed = projects.slice(0, MAX_PROJECTS);
  if (projects.length > listed.length) {
    console.warn(`[sitemap] ${projects.length - listed.length} Wachen ausgelassen (URL-Limit erreicht)`);
  }

  return [
    ...entry(landingPath),
    ...entry((l) => sectionPath('watches', l)),
    ...listed.flatMap((p) =>
      // Kein echtes Änderungsdatum vorhanden: PrayerProject hat nur createdAt, kein
      // updatedAt (Merkposten im Backlog). createdAt ist die ehrlichere Angabe als "heute".
      entry((l) => projectPath(l, p.id), p.createdAt ? new Date(p.createdAt) : undefined),
    ),
    // Rechtsseiten sind bewusst nur deutsch und daher ohne Sprach-Alternates.
    { url: absoluteUrl('/impressum'), changeFrequency: 'yearly' as const },
    { url: absoluteUrl('/datenschutz'), changeFrequency: 'yearly' as const },
  ];
}
