'use client';

import { createContext, Fragment, useContext, useEffect, useState } from 'react';
import { detectLocale, getLocale, persistLocale, setLocale, type Locale } from './i18n';

interface LocaleCtx {
  locale: Locale;
  switchLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx>({ locale: 'de', switchLocale: () => {} });

/**
 * Wendet nach dem Mount die erkannte Sprache an (Browser-Sprache bzw. gespeicherte Wahl)
 * und rendert den Baum neu — SSR bleibt de, dadurch kein Hydration-Mismatch.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setState] = useState<Locale>(getLocale());

  useEffect(() => {
    const detected = detectLocale();
    setLocale(detected);
    setState(detected);
    document.documentElement.lang = detected;
  }, []);

  const switchLocale = (l: Locale) => {
    persistLocale(l);
    setLocale(l);
    setState(l);
    document.documentElement.lang = l;
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
