/**
 * Fehler eines API-Aufrufs mit HTTP-Status, maschinenlesbarem Code und dem geparsten Body.
 * Phase 2 (I-8/I-9): Die Karte „Ende der Wache“ erkennt Server-Ablehnungen ausschließlich über
 * `code` (nie über den Meldungstext) und liest Zusatzfelder wie `earliestEnd` aus `data`.
 * `message` bleibt identisch zum bisherigen `Error(message)` — bestehende Aufrufer, die
 * `(e as Error).message` lesen (u. a. Buchungsflow in store.ts), merken keinen Unterschied.
 *
 * Bewusst ein eigenes Modul und nicht Teil von `@/lib/api` (RESEARCH Pitfall 4):
 * Komponententests mocken `@/lib/api` komplett — läge die Klasse dort, wäre sie im Test undefined.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Duck-Typing statt `instanceof`: robust gegen `vi.mock('@/lib/api')` in Komponententests und
 * gegen doppelt geladene Modulinstanzen. Erkennt jedes Objekt mit numerischem `status` und
 * String-`message`.
 */
export function isApiError(e: unknown): e is ApiError {
  if (typeof e !== 'object' || e === null) return false;
  const o = e as { status?: unknown; message?: unknown };
  return typeof o.status === 'number' && typeof o.message === 'string';
}
