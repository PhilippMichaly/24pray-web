// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, bookSlot } from './api';

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
