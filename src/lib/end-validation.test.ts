import { describe, it, expect } from 'vitest';
import { validateCustomEnd } from './end-validation';

// DST-freie Januar-Fixtures (Pitfall 1) — lokales Parsing wie im Formular.
const startMs = new Date('2099-01-01T00:00').getTime();
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

describe('validateCustomEnd — notAfterStart', () => {
  it('Ende gleich Start wird abgelehnt', () => {
    expect(validateCustomEnd(startMs, startMs, HOUR)).toEqual({ key: 'notAfterStart' });
  });
  it('Ende vor Start wird abgelehnt', () => {
    expect(validateCustomEnd(startMs, startMs - HOUR, HOUR)).toEqual({ key: 'notAfterStart' });
  });
});

describe('validateCustomEnd — tooLong', () => {
  it('366 Tage + 60 Minuten werden für 60-Minuten-Slots abgelehnt', () => {
    expect(validateCustomEnd(startMs, startMs + 366 * DAY + 60 * MIN, HOUR)).toEqual({ key: 'tooLong' });
  });
  it('366 Tage + 60 Minuten werden für 1440-Minuten-Slots abgelehnt', () => {
    expect(validateCustomEnd(startMs, startMs + 366 * DAY + 60 * MIN, 24 * HOUR)).toEqual({ key: 'tooLong' });
  });
});

describe('validateCustomEnd — 366-Tage-Grenze (API-Parität, Pitfall 2)', () => {
  it('exakt 366 Tage sind für beide Slotgrößen erlaubt', () => {
    expect(validateCustomEnd(startMs, startMs + 366 * DAY, HOUR)).toBeNull();
    expect(validateCustomEnd(startMs, startMs + 366 * DAY, 24 * HOUR)).toBeNull();
  });
  it('366 Tage + 1 Minute werden abgelehnt', () => {
    expect(validateCustomEnd(startMs, startMs + 366 * DAY + MIN, HOUR)).toEqual({ key: 'tooLong' });
    expect(validateCustomEnd(startMs, startMs + 366 * DAY + MIN, 24 * HOUR)).toEqual({ key: 'tooLong' });
  });
  it('Grenze gilt exakt wie die API: 366 Tage sind erlaubt, die API lehnt nur strikt größer ab', () => {
    // 366 * 86_400_000 ms — identischer Vergleichsoperand wie in 24pray-api assertProjectSpan
    expect(validateCustomEnd(startMs, startMs + 366 * 86_400_000, HOUR)).toBeNull();
  });
});

describe('validateCustomEnd — notAligned', () => {
  it('90 Minuten sind kein Vielfaches von 60-Minuten-Slots; Beispiel = Start + 2 Slots', () => {
    expect(validateCustomEnd(startMs, startMs + 90 * MIN, HOUR)).toEqual({
      key: 'notAligned',
      exampleMs: startMs + 2 * HOUR,
    });
  });
  it('2 Tage + 23 Stunden (71 h) sind kein Vielfaches von 1440-Minuten-Slots; Beispiel = Start + 3 Tage', () => {
    expect(validateCustomEnd(startMs, startMs + 2 * DAY + 23 * HOUR, 24 * HOUR)).toEqual({
      key: 'notAligned',
      exampleMs: startMs + 3 * DAY,
    });
  });
});

describe('validateCustomEnd — valide Ausrichtung', () => {
  it('ganzzahliges Vielfaches der Slotgröße gibt null zurück', () => {
    expect(validateCustomEnd(startMs, startMs + 48 * HOUR, HOUR)).toBeNull();
    expect(validateCustomEnd(startMs, startMs + 14 * DAY, 24 * HOUR)).toBeNull();
  });
});
