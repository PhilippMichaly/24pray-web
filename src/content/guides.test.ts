import { describe, it, expect } from 'vitest';
import { findGuide, GUIDE_LOCALES, GUIDES, isGuideLocale } from './guides';
import { SECTIONS, sectionSlug } from '@/lib/routes';

describe('Ratgeber-Inhalte', () => {
  it('jeder Ratgeber hat in jeder Ratgeber-Sprache Titel, Beschreibung und Abschnitte', () => {
    for (const g of GUIDES) {
      for (const l of GUIDE_LOCALES) {
        const text = g.text[l];
        expect(text.title, `${g.id}/${l}`).toBeTruthy();
        expect(text.sections.length, `${g.id}/${l}`).toBeGreaterThan(0);
        // Google kürzt Descriptions um ~160 Zeichen — länger verschenkt den Rest.
        expect(text.description.length, `${g.id}/${l}`).toBeLessThanOrEqual(170);
      }
    }
  });

  it('Artikel-Slugs sind pro Sprache eindeutig und URL-tauglich', () => {
    for (const l of GUIDE_LOCALES) {
      const slugs = GUIDES.map((g) => g.text[l].slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('findGuide findet jeden Artikel über seinen Slug und nur in der eigenen Sprache', () => {
    for (const g of GUIDES) {
      expect(findGuide('de', g.text.de.slug)?.id).toBe(g.id);
      expect(findGuide('en', g.text.de.slug)).toBeNull();
    }
  });

  it('he/ar haben (noch) keine Ratgeber', () => {
    expect(isGuideLocale('he')).toBe(false);
    expect(isGuideLocale('ar')).toBe(false);
    expect(isGuideLocale('de')).toBe(true);
  });

  it('die Ratgeber-Sektion hat lokalisierte Slugs', () => {
    expect(SECTIONS).toContain('guide');
    expect(sectionSlug('guide', 'de')).toBe('ratgeber');
    expect(sectionSlug('guide', 'es')).toBe('guias');
  });
});
