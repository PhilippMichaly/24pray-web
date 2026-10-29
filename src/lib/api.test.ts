// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, bookSlot, cancelSlot } from './api';
import { ApiError, isApiError } from './api-error';

// Root-Cause Logout-Bug (2026-07-08): Content-Type: application/json OHNE Body
// → Fastify 400 "Body cannot be empty..." → logout()/recurSlot() warfen in jedem Kontext.
describe('ApiClient — body-lose Requests', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('POST ohne Body sendet KEINEN Content-Type-Header (Fastify lehnt leeren JSON-Body ab)', async () => {
    await api.post('/auth/logout');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBeUndefined();
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('POST mit Body sendet Content-Type application/json', async () => {
    await api.post('/auth/magic-link', { email: 'a@example.com' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ email: 'a@example.com' }));
  });
});

describe('bookSlot — Invite', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 's1' }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('bookSlot sendet invite im Body, wenn übergeben', async () => {
    await bookSlot('p1', { startTime: '2026-10-24T10:00:00.000Z', invite: 'tok' });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).invite).toBe('tok');
  });

  it('bookSlot sendet kein invite-Feld, wenn keins übergeben', async () => {
    await bookSlot('p1', { startTime: '2026-10-24T10:00:00.000Z' });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).not.toHaveProperty('invite');
  });
});

describe('cancelSlot — Gast-Token im Header (W4)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sendet den Token als X-Guest-Token und nicht in der URL', async () => {
    await cancelSlot('s1', 'g');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/slots\/s1$/);
    expect(init.method).toBe('DELETE');
    expect(init.headers['X-Guest-Token']).toBe('g');
  });

  it('ohne Token kein Header und keine Query', async () => {
    await cancelSlot('s1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/slots\/s1$/);
    expect(init.headers['X-Guest-Token']).toBeUndefined();
  });
});

// Phase 2 (02-02): request() wirft ApiError mit Status/Code/Body; message bleibt wie bisher.
describe('ApiClient — ApiError (Phase 2)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('409 mit Code und earliestEnd → ApiError mit status, code, data und unveränderter message', async () => {
    fetchMock.mockResolvedValueOnce(
      json(409, { message: 'X', code: 'END_CUTS_BOOKING', earliestEnd: '2099-01-11T10:00:00.000Z' }),
    );
    const err = await api.patch('/projects/p1', { endDate: 'x' }).catch((e: unknown) => e);
    expect(isApiError(err)).toBe(true);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    const e = err as ApiError;
    expect(e.status).toBe(409);
    expect(e.code).toBe('END_CUTS_BOOKING');
    expect(e.data?.earliestEnd).toBe('2099-01-11T10:00:00.000Z');
    expect(e.message).toBe('X');
  });

  it('500 mit Nicht-JSON-Body → message „Unbekannter Fehler“, status 500, kein code', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>boom</html>', { status: 500 }));
    const e = (await api.get('/x').catch((x: unknown) => x)) as ApiError;
    expect(isApiError(e)).toBe(true);
    expect(e.message).toBe('Unbekannter Fehler');
    expect(e.status).toBe(500);
    expect(e.code).toBeUndefined();
  });

  it('JSON ohne code → code undefined, message aus dem Body', async () => {
    fetchMock.mockResolvedValueOnce(json(403, { message: 'Keine Berechtigung' }));
    const e = (await api.get('/x').catch((x: unknown) => x)) as ApiError;
    expect(e.code).toBeUndefined();
    expect(e.status).toBe(403);
    expect(e.message).toBe('Keine Berechtigung');
  });

  it('nicht-String-code wird ignoriert; ohne message bleibt der Fallback „HTTP <Status>“', async () => {
    fetchMock.mockResolvedValueOnce(json(418, { code: 42 }));
    const e = (await api.get('/x').catch((x: unknown) => x)) as ApiError;
    expect(e.code).toBeUndefined();
    expect(e.message).toBe('HTTP 418');
  });

  it('isApiError: einfacher Error und null sind keine ApiError', () => {
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError('x')).toBe(false);
  });
});
