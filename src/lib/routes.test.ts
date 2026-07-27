import { describe, it, expect } from 'vitest';
import {
  alternatesFor,
  FALLBACK_LOCALE,
  isUnprefixedRoute,
  landingPath,
  localeFromAcceptLanguage,
  projectPath,
  SECTIONS,
  sectionFromSlug,
  sectionPath,
  sectionSlug,
} from './routes';
import { SUPPORTED_LOCALES } from './i18n';

describe('Slug-Map', () => {
  it('jede Sektion hat für jede Sprache einen Slug', () => {
    for (const section of SECTIONS) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(sectionSlug(section, locale), `${section}/${locale}`).toBeTruthy();
      }
    }
  });

  it('Slugs sind pro Sprache eindeutig — sonst wäre der Rewrite mehrdeutig', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const slugs = SECTIONS.map((s) => sectionSlug(s, locale));
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it('kein Slug kollidiert mit dem internen Routennamen (sonst Redirect-Schleife)', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const section of SECTIONS) {
        expect(sectionSlug(section, locale)).not.toBe(section);
      }
    }
  });

  it('sectionFromSlug ist die Umkehrung von sectionSlug', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const section of SECTIONS) {
        expect(sectionFromSlug(locale, sectionSlug(section, locale))).toBe(section);
      }
    }
    expect(sectionFromSlug('de', 'gibtsnicht')).toBeNull();
    // Deutscher Slug unter englischer Sprache darf NICHT auflösen.
    expect(sectionFromSlug('en', 'gebetswachen')).toBeNull();
  });

  it('Pfade sind sprachpräfigiert', () => {
    expect(landingPath('de')).toBe('/de');
    expect(sectionPath('watches', 'de')).toBe('/de/gebetswachen');
    expect(sectionPath('watches', 'en')).toBe('/en/prayer-watches');
    expect(projectPath('es', 'abc')).toBe('/es/projects/abc');
  });
});

describe('hreflang-Alternates', () => {
  it('enthält alle 5 Sprachen plus x-default und einen selbstbezüglichen Canonical', () => {
    const alt = alternatesFor('en', (l) => sectionPath('watches', l));
    for (const l of SUPPORTED_LOCALES) expect(alt.languages[l]).toContain(sectionPath('watches', l));
    expect(alt.languages['x-default']).toBe(alt.languages[FALLBACK_LOCALE]);
    expect(alt.canonical).toBe(alt.languages.en);
  });
});

describe('Accept-Language', () => {
  it('erkennt geführte Sprachen und achtet auf q-Gewichte', () => {
    expect(localeFromAcceptLanguage('de-DE,de;q=0.9,en;q=0.8')).toBe('de');
    expect(localeFromAcceptLanguage('es-MX,es;q=0.9')).toBe('es');
    expect(localeFromAcceptLanguage('he-IL')).toBe('he');
    expect(localeFromAcceptLanguage('ar')).toBe('ar');
    // en steht vorn, hat aber das kleinere Gewicht.
    expect(localeFromAcceptLanguage('en;q=0.5,de;q=0.9')).toBe('de');
  });

  it('unbekannte oder fehlende Sprache → Fallback', () => {
    expect(localeFromAcceptLanguage('ja-JP,ja;q=0.9')).toBe(FALLBACK_LOCALE);
    expect(localeFromAcceptLanguage(null)).toBe(FALLBACK_LOCALE);
    expect(localeFromAcceptLanguage('')).toBe(FALLBACK_LOCALE);
  });
});

describe('unpräfigierte Routen', () => {
  it('App- und Rechtsseiten bleiben ohne Sprachprefix', () => {
    for (const p of ['/dashboard', '/profil', '/auth/login', '/join/tok', '/projects/new', '/impressum', '/datenschutz']) {
      expect(isUnprefixedRoute(p), p).toBe(true);
    }
  });

  it('öffentliche Wachenseiten gehören NICHT dazu (sie werden präfigiert)', () => {
    expect(isUnprefixedRoute('/projects/abc123')).toBe(false);
    expect(isUnprefixedRoute('/')).toBe(false);
    // Teil-Treffer dürfen nicht greifen.
    expect(isUnprefixedRoute('/dashboards')).toBe(false);
  });
});
