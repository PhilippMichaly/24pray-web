import { SUPPORTED_LOCALES, type Locale } from './i18n';

/** Sprache der Rechtsseiten und der Fallback für alles Unbekannte auf Serverseite. */
export const DEFAULT_LOCALE: Locale = 'de';

/** Sprache für Besucher, deren Browsersprache wir nicht führen — identisch zur Client-Logik
 *  in `detectLocale()`. Diese Version bekommt auch `hreflang="x-default"`. */
export const FALLBACK_LOCALE: Locale = 'en';

/** Basis-URL aller absoluten Links (Canonical, hreflang, Sitemap, OpenGraph).
 *  Muss im Produktions-Build gesetzt sein, sonst zeigen Canonicals auf localhost. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://24pray.org').replace(/\/+$/, '');

/**
 * Interner Routenname → lokalisierter URL-Slug.
 *
 * Warum überhaupt lokalisiert: `/en/gebetswachen` liest sich für englische Nutzer kaputt und
 * verschenkt das Keyword in der URL. Warum he/ar trotzdem den englischen Slug bekommen:
 * hebräische und arabische Pfade werden prozent-kodiert und sind dann weder lesbar noch
 * sinnvoll teilbar — ein lateinischer Slug ist dort das kleinere Übel.
 */
export const SECTION_SLUGS = {
  watches: {
    de: 'gebetswachen',
    en: 'prayer-watches',
    es: 'vigilias-de-oracion',
    he: 'prayer-watches',
    ar: 'prayer-watches',
  },
} as const satisfies Record<string, Record<Locale, string>>;

export type Section = keyof typeof SECTION_SLUGS;

export const SECTIONS = Object.keys(SECTION_SLUGS) as Section[];

export function sectionSlug(section: Section, locale: Locale): string {
  return SECTION_SLUGS[section][locale];
}

/** Lokalisierter Slug → interner Routenname (Middleware-Rewrite). */
export function sectionFromSlug(locale: Locale, slug: string): Section | null {
  return SECTIONS.find((s) => SECTION_SLUGS[s][locale] === slug) ?? null;
}

export function landingPath(locale: Locale): string {
  return `/${locale}`;
}

export function sectionPath(section: Section, locale: Locale): string {
  return `/${locale}/${sectionSlug(section, locale)}`;
}

export function projectPath(locale: Locale, id: string): string {
  return `/${locale}/projects/${id}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Canonical + vollständiges hreflang-Set für eine öffentliche Seite.
 * `pathFor` liefert den Pfad je Sprache (Slugs unterscheiden sich!).
 */
export function alternatesFor(
  locale: Locale,
  pathFor: (l: Locale) => string,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) languages[l] = absoluteUrl(pathFor(l));
  languages['x-default'] = absoluteUrl(pathFor(FALLBACK_LOCALE));
  return { canonical: absoluteUrl(pathFor(locale)), languages };
}

/** Routen, die bewusst OHNE Sprachprefix bleiben.
 *
 *  App-Routen sind `noindex` und werden teils aus API-Mails verlinkt (Magic-Link,
 *  Einladung, Abmelde-Link) — ein Prefix würde bestehende Links brechen und einen
 *  Eingriff im API-Repo erzwingen. Impressum/Datenschutz sind bewusst nur deutsch.
 */
export const UNPREFIXED_ROUTES = [
  '/dashboard',
  '/profil',
  '/auth',
  '/join',
  '/projects/new',
  '/impressum',
  '/datenschutz',
] as const;

export function isUnprefixedRoute(pathname: string): boolean {
  return UNPREFIXED_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** Erste erkennbare Sprache aus einem Accept-Language-Header.
 *  Bewusst identisch zur Client-Logik: de/es/he/ar per Prefix, sonst Englisch. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return FALLBACK_LOCALE;
  const tags = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split('=')[1]) : 1 };
    })
    .filter((x) => x.tag && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    const match = SUPPORTED_LOCALES.find((l) => l !== 'en' && tag.startsWith(l));
    if (match) return match;
    if (tag.startsWith('en')) return 'en';
  }
  return FALLBACK_LOCALE;
}
