import { describe, it, expect } from 'vitest';
import { subsolarPoint, startLongitude } from './sun';

describe('subsolarPoint', () => {
  it('Sommersonnenwende mittags UTC: ~23,44° N über Greenwich', () => {
    const p = subsolarPoint(new Date('2026-06-21T12:00:00Z'));
    expect(p.lat).toBeGreaterThan(22.9);
    expect(p.lat).toBeLessThanOrEqual(23.44);
    expect(p.lon).toBeCloseTo(0, 5);
  });
  it('Wintersonnenwende: ~23,44° S', () => {
    expect(subsolarPoint(new Date('2026-12-21T12:00:00Z')).lat).toBeLessThan(-22.9);
  });
  it('Tagundnachtgleiche: nahe am Äquator', () => {
    expect(Math.abs(subsolarPoint(new Date('2026-03-20T12:00:00Z')).lat)).toBeLessThan(1.5);
  });
  it('18:00 UTC: Sonne über 90° W; Mitternacht UTC: über der Datumsgrenze', () => {
    expect(subsolarPoint(new Date('2026-06-21T18:00:00Z')).lon).toBeCloseTo(-90, 5);
    expect(Math.abs(subsolarPoint(new Date('2026-06-21T00:00:00Z')).lon)).toBeCloseTo(180, 5);
  });
});

describe('startLongitude', () => {
  it('nimmt die Normalzeit (größerer Offset), 15° je Stunde', () => {
    expect(startLongitude(-60, -120)).toBe(15); // Berlin
    expect(startLongitude(300, 240)).toBe(-75); // New York
    expect(startLongitude(-660, -600)).toBe(150); // Sydney (Sommerzeit im Januar)
    expect(startLongitude(-330, -330)).toBe(82.5); // Indien
  });
  it('UTC ergibt 0, nicht -0', () => {
    expect(Object.is(startLongitude(0, 0), 0)).toBe(true);
  });
});
