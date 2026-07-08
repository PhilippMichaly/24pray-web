// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { t, setLocale, getLocale, detectLocale } from './i18n';
import { LocaleProvider, useLocale } from './locale-context';

function langMock(lang: string) {
  vi.stubGlobal('navigator', { ...navigator, language: lang, languages: [lang] });
}

describe('Locale-Erkennung + Umschaltung', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    setLocale('de');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('t() liefert je Locale den passenden Katalog', () => {
    expect(t('cancel')).toBe('Abbrechen');
    setLocale('en');
    expect(t('cancel')).toBe('Cancel');
    expect(getLocale()).toBe('en');
  });

  it('detectLocale: Browser-Sprache entscheidet (kein Geo-IP), localStorage-Wahl gewinnt', () => {
    langMock('en-US');
    expect(detectLocale()).toBe('en');
    langMock('de-AT');
    expect(detectLocale()).toBe('de');
    langMock('fr-FR');
    expect(detectLocale()).toBe('en'); // Fallback für unbekannte Sprachen: Englisch
    localStorage.setItem('24pray:locale', 'de');
    expect(detectLocale()).toBe('de'); // manuelle Wahl schlägt Browser-Sprache
  });

  it('detectLocale: es/he/ar-Browsersprachen werden erkannt', () => {
    langMock('es-MX');
    expect(detectLocale()).toBe('es');
    langMock('he-IL');
    expect(detectLocale()).toBe('he');
    langMock('ar-EG');
    expect(detectLocale()).toBe('ar');
  });

  it('t() liefert für es/he/ar den jeweiligen Katalog (Katalog-Vollständigkeit via Typ erzwungen)', () => {
    setLocale('es');
    expect(t('cancel')).toBe('Cancelar');
    setLocale('he');
    expect(t('cancel')).toBe('ביטול');
    setLocale('ar');
    expect(t('cancel')).toBe('إلغاء');
  });

  it('LocaleProvider wendet die erkannte Sprache nach Mount an und Umschalten persistiert', async () => {
    langMock('en-US');
    // PureText ist KEIN Context-Consumer — genau solche Komponenten blieben beim
    // Umschalten stehen (children-Bailout). Der Provider muss sie mit-remounten.
    function PureText() {
      return <span data-testid="pure">{t('cancel')}</span>;
    }
    function Probe() {
      const { locale, switchLocale } = useLocale();
      return (
        <div>
          <span data-testid="txt">{t('cancel')}</span>
          <span data-testid="loc">{locale}</span>
          <button onClick={() => switchLocale(locale === 'de' ? 'en' : 'de')}>toggle</button>
        </div>
      );
    }
    render(
      <LocaleProvider>
        <Probe />
        <PureText />
      </LocaleProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe('en'));
    expect(screen.getByTestId('txt').textContent).toBe('Cancel');
    expect(screen.getByTestId('pure').textContent).toBe('Cancel'); // Nicht-Consumer muss mitziehen
    expect(document.documentElement.lang).toBe('en');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    await waitFor(() => expect(screen.getByTestId('txt').textContent).toBe('Abbrechen'));
    expect(screen.getByTestId('pure').textContent).toBe('Abbrechen'); // Nicht-Consumer muss mitziehen
    expect(localStorage.getItem('24pray:locale')).toBe('de');
    expect(document.documentElement.lang).toBe('de');
  });

  it('RTL: Provider setzt dir="rtl" bei he/ar und zurück auf "ltr" bei de/en/es', async () => {
    function Probe() {
      const { locale, switchLocale } = useLocale();
      return (
        <div>
          <span data-testid="loc">{locale}</span>
          <button onClick={() => switchLocale('he')}>he</button>
          <button onClick={() => switchLocale('ar')}>ar</button>
          <button onClick={() => switchLocale('de')}>de</button>
        </div>
      );
    }
    langMock('de-DE');
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe('de'));
    expect(document.documentElement.dir).toBe('ltr');

    fireEvent.click(screen.getByRole('button', { name: 'he' }));
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));

    fireEvent.click(screen.getByRole('button', { name: 'ar' }));
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));

    fireEvent.click(screen.getByRole('button', { name: 'de' }));
    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
  });
});
