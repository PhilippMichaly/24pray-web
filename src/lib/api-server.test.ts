import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchPublicProject, fetchPublicProjects } from './api-server';

function project(over: Record<string, unknown> = {}) {
  return { id: 'p1', title: 'Wache', visibility: 'PUBLIC', totalSlots: 24, bookedSlots: 3, ...over };
}

function mockFetch(impl: (url: string) => unknown) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const body = impl(String(url));
    if (body === undefined) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => body };
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchPublicProject', () => {
  it('liefert eine PUBLIC-Wache', async () => {
    mockFetch(() => project());
    expect(await fetchPublicProject('p1')).toMatchObject({ id: 'p1', visibility: 'PUBLIC' });
  });

  it('PRIVATE wird verworfen — nichts Privates darf ins gerenderte HTML', async () => {
    mockFetch(() => project({ visibility: 'PRIVATE' }));
    expect(await fetchPublicProject('p1')).toBeNull();
  });

  it('404/403 der API → null statt Fehler', async () => {
    mockFetch(() => undefined);
    expect(await fetchPublicProject('weg')).toBeNull();
  });

  it('Netzwerkfehler oder Timeout darf die Seite nie brechen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));
    expect(await fetchPublicProject('p1')).toBeNull();
    expect(await fetchPublicProjects()).toEqual([]);
  });

  it('die ID wird für die URL kodiert', async () => {
    const spy = vi.fn(async (_url: string) => ({ ok: true, status: 200, json: async () => project() }));
    vi.stubGlobal('fetch', spy);
    await fetchPublicProject('a/b?x');
    expect(String(spy.mock.calls[0][0])).toContain('/projects/a%2Fb%3Fx');
  });
});

describe('fetchPublicProjects', () => {
  it('filtert Nicht-PUBLIC heraus, auch wenn die API es je ausliefern sollte', async () => {
    mockFetch(() => [project({ id: 'a' }), project({ id: 'b', visibility: 'PRIVATE' })]);
    const list = await fetchPublicProjects();
    expect(list.map((p) => p.id)).toEqual(['a']);
  });

  it('unerwartete Antwortform → leere Liste', async () => {
    mockFetch(() => ({ message: 'kaputt' }));
    expect(await fetchPublicProjects()).toEqual([]);
  });
});
