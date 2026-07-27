import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ProjectWithStats } from '@/types';
import { SUPPORTED_LOCALES } from '@/lib/i18n';

const publicProject = {
  id: 'p-pub',
  title: 'Nachtgebet für die Stadt',
  description:
    'Wir beten seit Wochen für Frieden und Versöhnung in unserer Stadt. Diese Beschreibung ist absichtlich sehr lang gehalten, damit sie beim Kürzen auf 160 Zeichen sichtbar abgeschnitten werden muss und wir den Kürzungspfad zuverlässig testen können.',
  status: 'ACTIVE',
  visibility: 'PUBLIC',
  timezone: 'UTC',
  startDate: '2099-01-01T00:00:00.000Z',
  endDate: '2099-01-02T00:00:00.000Z',
  totalSlots: 24,
  bookedSlots: 3,
  organizerName: 'Maria',
  organizerId: 'u1',
  inviteToken: 'tok',
  createdAt: '2099-01-01T00:00:00.000Z',
} as ProjectWithStats;

const publicProjectNoDescription = {
  ...publicProject,
  id: 'p-pub-nodesc',
  description: null,
} as ProjectWithStats;

const load = async () => (await import('./metadata')).generateMetadata;

describe('generateMetadata — Wachenseite', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('PUBLIC: Titel + gekürzte Beschreibung aus der Wache', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(publicProject), { status: 200 }));
    const meta = await (await load())({ params: { locale: 'de', id: 'p-pub' } });

    expect(meta.title).toBe('Nachtgebet für die Stadt — 24pray');
    expect(typeof meta.description).toBe('string');
    expect((meta.description as string).length).toBeLessThanOrEqual(160);
    expect((meta.description as string).endsWith('…')).toBe(true);
    expect(meta.openGraph?.title).toBe(meta.title);
    expect((meta.twitter as { card?: string } | null)?.card).toBe('summary_large_image');
    expect(JSON.stringify(meta.openGraph)).toContain('/og-image.png');

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://localhost:3001/projects/p-pub');
  });

  it('PUBLIC: Canonical zeigt auf die eigene Sprache, hreflang deckt alle fünf ab', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(publicProject), { status: 200 }));
    const meta = await (await load())({ params: { locale: 'es', id: 'p-pub' } });

    expect(String(meta.alternates?.canonical)).toContain('/es/projects/p-pub');
    const languages = meta.alternates?.languages as Record<string, string>;
    for (const l of SUPPORTED_LOCALES) {
      expect(String(languages[l]), l).toContain(`/${l}/projects/p-pub`);
    }
    expect(languages['x-default']).toBe(languages.en);
  });

  it('PUBLIC: Titel wird pro Sprache lokalisiert beschrieben', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(publicProjectNoDescription), { status: 200 }),
    );
    const meta = await (await load())({ params: { locale: 'en', id: 'p-pub-nodesc' } });
    expect(meta.description).toContain('hours held');
  });

  it('ohne Beschreibung: Fallback nennt gehaltene Stunden', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(publicProjectNoDescription), { status: 200 }),
    );
    const meta = await (await load())({ params: { locale: 'de', id: 'p-pub-nodesc' } });

    expect(meta.description).toContain('3');
    expect(meta.description).toContain('24');
    expect(meta.description).toContain('Stunden');
  });

  it('Tages-Wache ohne Beschreibung: Fallback sagt "Tagen" statt "Stunden"', async () => {
    const dayProject = { ...publicProjectNoDescription, id: 'p-pub-day', slotDurationMinutes: 1440 };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(dayProject), { status: 200 }));
    const meta = await (await load())({ params: { locale: 'de', id: 'p-pub-day' } });

    expect(meta.description).toContain('Tagen');
    expect(meta.description).not.toContain('Stunden');
  });

  it('PRIVATE-Wache: generische Defaults UND noindex — nichts davon in den Index', async () => {
    const priv = { ...publicProject, id: 'p-priv', visibility: 'PRIVATE' };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(priv), { status: 200 }));
    const meta = await (await load())({ params: { locale: 'de', id: 'p-priv' } });

    expect(JSON.stringify(meta)).not.toContain('Nachtgebet');
    expect((meta.robots as { index?: boolean }).index).toBe(false);
  });

  it('403/404/Netzwerkfehler: generische Defaults, kein Bruch, noindex', async () => {
    for (const response of [
      new Response('{}', { status: 403 }),
      new Response('{}', { status: 404 }),
    ]) {
      fetchMock.mockResolvedValue(response);
      const meta = await (await load())({ params: { locale: 'de', id: 'x' } });
      expect(meta.description).not.toContain('Nachtgebet');
      expect((meta.robots as { index?: boolean }).index).toBe(false);
    }
    fetchMock.mockRejectedValue(new Error('fetch failed'));
    const meta = await (await load())({ params: { locale: 'de', id: 'p-err' } });
    expect((meta.robots as { index?: boolean }).index).toBe(false);
  });

  it('nutzt API_URL_INTERNAL statt der öffentlichen NEXT_PUBLIC_API_URL', async () => {
    const prev = process.env.API_URL_INTERNAL;
    process.env.API_URL_INTERNAL = 'http://internal-api:4000';
    fetchMock.mockResolvedValue(new Response(JSON.stringify(publicProject), { status: 200 }));
    await (await load())({ params: { locale: 'de', id: 'p-pub' } });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://internal-api:4000/projects/p-pub');
    process.env.API_URL_INTERNAL = prev;
  });
});
