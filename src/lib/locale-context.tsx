'use client';

import { createContext, Fragment, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  detectLocale,
  isRtl,
  LOCALE_COOKIE,
  persistLocale,
  setLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from './i18n';

interface LocaleCtx {
  locale: Locale;
  switchLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx>({ locale: 'de', switchLocale: () => {} });

/** Ein Jahr; die Middleware liest das Cookie, um schon serverseitig richtig zu rendern. */
function persistCookie(l: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

/** Ersetzt das Sprachsegment in einer präfigierten URL: /de/gebetswachen → /en/… */
function swapLocaleInPath(pathname: string, next: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  segments[0] = next;
  return `/${segments.join('/')}`;
}

/**
 * `initialLocale` kommt aus dem `x-locale`-Header der Middleware — auf präfigierten Seiten
 * ist das die Sprache der URL. Damit rendert schon der Server in der richtigen Sprache;
 * `setLocale` läuft bewusst SYNCHRON im Render-Body, weil `t()`-Aufrufer keine
 * Context-Consumer sind und sonst die erste Ausgabe in der Vorgänger-Sprache erzeugen würden.
 *
 * `prefixed` unterscheidet die beiden Welten: öffentliche Seiten tragen die Sprache in der
 * URL (Sprachwechsel = Navigation), App-Seiten wie /dashboard nicht (Sprachwechsel = Remount).
 */
export function LocaleProvider({
  children,
  initialLocale = 'de',
  prefixed = false,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  prefixed?: boolean;
}) {
  const [locale, setState] = useState<Locale>(initialLocale);
  const router = useRouter();
  const pathname = usePathname();

  setLocale(locale);

  useEffect(() => {
    // Auf präfigierten Seiten gewinnt IMMER die URL — sie ist die kanonische Quelle und
    // steht so auch im Canonical-Tag. Nur ohne Prefix darf die gespeicherte Wahl greifen.
    if (prefixed) {
      persistCookie(initialLocale);
      persistLocale(initialLocale);
      if (initialLocale !== locale) {
        setLocale(initialLocale);
        setState(initialLocale);
      }
      return;
    }
    const detected = detectLocale();
    if (detected !== locale) {
      setLocale(detected);
      setState(detected);
    }
    persistCookie(detected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefixed, initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
  }, [locale]);

  const switchLocale = (l: Locale) => {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(l)) return;
    persistLocale(l);
    persistCookie(l);
    if (prefixed) {
      // Sprachwechsel ist hier eine echte Navigation: jede Sprache hat ihre eigene URL,
      // damit Google sie getrennt indexieren kann.
      router.push(swapLocaleInPath(pathname, l));
      return;
    }
    setLocale(l);
    setState(l);
  };

  return (
    <Ctx.Provider value={{ locale, switchLocale }}>
      {/* key erzwingt Remount des Baums beim Sprachwechsel: t()-Aufrufer sind keine
          Context-Consumer und blieben sonst im children-Bailout alt stehen. */}
      <Fragment key={locale}>{children}</Fragment>
    </Ctx.Provider>
  );
}

export function useLocale(): LocaleCtx {
  return useContext(Ctx);
}
