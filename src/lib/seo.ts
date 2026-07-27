import { translate, type Locale } from './i18n';
import { absoluteUrl, landingPath, projectPath, sectionPath, SITE_URL } from './routes';
import type { ProjectWithStats } from '@/types';

/**
 * App-Routen aus dem Index halten. `follow` bleibt an, damit Google den Links von dort
 * trotzdem folgt — es geht darum, kontoabhängige und Einweg-Seiten nicht zu listen,
 * nicht darum, den Crawler auszusperren.
 */
export const NOINDEX = { robots: { index: false, follow: true } } as const;

/** Die FAQ-Paare der Landing — eine Liste, damit Text und JSON-LD nie auseinanderlaufen. */
export const FAQ_KEYS = [
  ['faqCostQ', 'faqCostA'],
  ['faqAccountQ', 'faqAccountA'],
  ['faqWhoQ', 'faqWhoA'],
  ['faqTimezoneQ', 'faqTimezoneA'],
  ['faqPrivateQ', 'faqPrivateA'],
] as const;

export function siteJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: '24pray',
        url: SITE_URL,
        logo: absoluteUrl('/icons/icon-512.png'),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: '24pray',
        url: absoluteUrl(landingPath(locale)),
        inLanguage: locale,
        description: translate(locale, 'seoSiteDescription'),
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };
}

export function faqJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_KEYS.map(([q, a]) => ({
      '@type': 'Question',
      name: translate(locale, q),
      acceptedAnswer: { '@type': 'Answer', text: translate(locale, a) },
    })),
  };
}

/** Eine Gebetswache als Event. Ohne Ortsangabe ist sie ein reiner Online-Termin —
 *  schema.org verlangt `location`, deshalb dann eine VirtualLocation statt gar nichts. */
export function watchEventJsonLd(locale: Locale, project: ProjectWithStats) {
  const url = absoluteUrl(projectPath(locale, project.id));
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: project.title,
    ...(project.description ? { description: project.description } : {}),
    startDate: project.startDate,
    endDate: project.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: project.locationName
      ? 'https://schema.org/MixedEventAttendanceMode'
      : 'https://schema.org/OnlineEventAttendanceMode',
    isAccessibleForFree: true,
    inLanguage: project.language,
    url,
    organizer: { '@type': 'Organization', name: project.organizerName || '24pray' },
    location: project.locationName
      ? { '@type': 'Place', name: project.locationName }
      : { '@type': 'VirtualLocation', url },
  };
}

export function watchListJsonLd(locale: Locale, projects: ProjectWithStats[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: translate(locale, 'watchesHeading'),
    url: absoluteUrl(sectionPath('watches', locale)),
    numberOfItems: projects.length,
    itemListElement: projects.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(projectPath(locale, p.id)),
      name: p.title,
    })),
  };
}
