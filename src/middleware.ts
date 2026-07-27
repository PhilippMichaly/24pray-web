import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, parseLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import {
  isUnprefixedRoute,
  localeFromAcceptLanguage,
  SECTIONS,
  sectionFromSlug,
  sectionSlug,
  type Section,
} from '@/lib/routes';

/** Sprache und Prefix-Status wandern als Header ins Rendering: das Root-Layout sitzt ÜBER dem
 *  `[locale]`-Segment und kann `<html lang>`/`dir` sonst nicht serverseitig richtig setzen. */
export const LOCALE_HEADER = 'x-locale';
export const PREFIXED_HEADER = 'x-locale-prefixed';

/** Alles, was nie durch die Sprachlogik laufen darf. */
function isBypass(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/earth/') ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function resolveLocale(req: NextRequest): Locale {
  return (
    parseLocale(req.cookies.get(LOCALE_COOKIE)?.value) ??
    localeFromAcceptLanguage(req.headers.get('accept-language'))
  );
}

function withLocaleHeaders(req: NextRequest, locale: Locale, prefixed: boolean) {
  const headers = new Headers(req.headers);
  headers.set(LOCALE_HEADER, locale);
  headers.set(PREFIXED_HEADER, prefixed ? '1' : '0');
  return headers;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isBypass(pathname)) return NextResponse.next();

  const segments = pathname.split('/').filter(Boolean);
  const urlLocale = parseLocale(segments[0] ?? null);

  // 1. Bereits sprachpräfigierte URL — der Regelfall für alle öffentlichen Seiten.
  if (urlLocale) {
    const rest = segments.slice(1);
    const headers = withLocaleHeaders(req, urlLocale, true);

    if (rest.length === 1) {
      // Der interne Routenname ist nie selbst ein Slug. Wird er direkt aufgerufen
      // (/en/watches), 308 auf die eine kanonische URL — sonst lieferten zwei Pfade
      // dieselbe Seite aus und Google sähe Duplicate Content.
      if ((SECTIONS as readonly string[]).includes(rest[0])) {
        const url = req.nextUrl.clone();
        url.pathname = `/${urlLocale}/${sectionSlug(rest[0] as Section, urlLocale)}`;
        return NextResponse.redirect(url, 308);
      }
      // Lokalisierter Slug → interne Route umschreiben (die URL bleibt lokalisiert).
      const section = sectionFromSlug(urlLocale, rest[0]);
      if (section) {
        const url = req.nextUrl.clone();
        url.pathname = `/${urlLocale}/${section}`;
        return NextResponse.rewrite(url, { request: { headers } });
      }
    }
    return NextResponse.next({ request: { headers } });
  }

  const locale = resolveLocale(req);

  // 2. App- und Rechtsseiten bleiben ohne Prefix, bekommen aber die Sprache fürs Rendering.
  if (isUnprefixedRoute(pathname)) {
    return NextResponse.next({ request: { headers: withLocaleHeaders(req, locale, false) } });
  }

  // 3. Startseite und alte, bereits geteilte Wachen-Links auf die Sprachversion führen.
  //    307 (temporär), weil das Ziel vom Besucher abhängt — kein dauerhaftes Mapping.
  if (pathname === '/' || pathname.startsWith('/projects/')) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.redirect(url, 307);
  }

  // 4. Alles andere läuft in das `[locale]`-Segment und dort in notFound().
  return NextResponse.next({ request: { headers: withLocaleHeaders(req, locale, false) } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

export { SUPPORTED_LOCALES };
