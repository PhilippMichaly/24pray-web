import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ProjectWithStats } from '@/types';

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

describe('generateMetadata — Projektseite (OpenGraph pro Kette)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('PUBLIC-Projekt: Titel + gekürzte Beschreibung aus der Kette', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(publicProject), { status: 200 }));
    const { generateMetadata } = await import('./layout');
    const meta = await generateMetadata({ params: { id: 'p-pub' } });

    expect(meta.title).toBe('Nachtgebet für die Stadt — Gebetswache auf 24pray');
    expect(typeof meta.description).toBe('string');
    expect((meta.description as string).length).toBeLessThanOrEqual(160);
    expect((meta.description as string).endsWith('…')).toBe(true);
    expect(meta.openGraph?.title).toBe(meta.title);
    expect((meta.twitter as { card?: string } | null)?.card).toBe('summary_large_image');
    expect(JSON.stringify(meta.openGraph)).toContain('/og-image.png');

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://localhost:3001/projects/p-pub');
  });

  it('PUBLIC-Projekt ohne Beschreibung: Fallback mit Stunden-Zahlen', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(publicProjectNoDescription), { status: 200 }),
    );
    const { generateMetadata } = await import('./layout');
    const meta = await generateMetadata({ params: { id: 'p-pub-nodesc' } });

    expect(meta.description).toContain('3');
    expect(meta.description).toContain('24');
  });

  it('403 (PRIVATE ohne Zugriff): generische Site-Defaults, kein Daten-Leak', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Kein Zugriff' }), { status: 403 }));
    const { generateMetadata } = await import('./layout');
    const meta = await generateMetadata({ params: { id: 'p-priv' } });

    expect(meta.title).toBe('24pray — Gemeinsam beten');
    expect(meta.description).not.toContain('Nachtgebet');
  });

  it('404: generische Site-Defaults', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'nicht gefunden' }), { status: 404 }));
    const { generateMetadata } = await import('./layout');
    const meta = await generateMetadata({ params: { id: 'p-missing' } });

    expect(meta.title).toBe('24pray — Gemeinsam beten');
  });

  it('Netzwerkfehler/Timeout: bricht nicht, liefert Site-Defaults', async () => {
    fetchMock.mockRejectedValue(new Error('fetch failed'));
    const { generateMetadata } = await import('./layout');
    const meta = await generateMetadata({ params: { id: 'p-err' } });

    expect(meta.title).toBe('24pray — Gemeinsam beten');
  });

  it('nutzt API_URL_INTERNAL statt der öffentlichen NEXT_PUBLIC_API_URL', async () => {
    const prev = process.env.API_URL_INTERNAL;
    process.env.API_URL_INTERNAL = 'http://internal-api:4000';
    fetchMock.mockResolvedValue(new Response(JSON.stringify(publicProject), { status: 200 }));
    const { generateMetadata } = await import('./layout');
    await generateMetadata({ params: { id: 'p-pub' } });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://internal-api:4000/projects/p-pub');
    process.env.API_URL_INTERNAL = prev;
  });
});
