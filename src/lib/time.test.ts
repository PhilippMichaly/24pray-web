import { describe, it, expect } from 'vitest';
import {
  formatSlotRange,
  formatDayHeader,
  isNightHour,
  formatDualTz,
  buildIcs,
  dayKey,
} from './time';

// 2026-07-06T02:00:00Z … in Europe/Berlin (UTC+2 im Sommer) = 04:00–05:00 lokal
const startUtc = '2026-07-06T02:00:00.000Z';
const endUtc = '2026-07-06T03:00:00.000Z';

describe('formatSlotRange', () => {
  it('rendert Stunden in Projekt-TZ als HH–HH', () => {
    expect(formatSlotRange(startUtc, endUtc, 'UTC')).toBe('02–03');
    expect(formatSlotRange(startUtc, endUtc, 'Europe/Berlin')).toBe('04–05');
  });
  it('nutzt En-Dash, keinen Bindestrich', () => {
    expect(formatSlotRange(startUtc, endUtc, 'UTC')).toContain('–');
    expect(formatSlotRange(startUtc, endUtc, 'UTC')).not.toContain('-');
  });
});

describe('formatDayHeader', () => {
  it('deutscher Wochentag + Tag + Monat in Projekt-TZ', () => {
    expect(formatDayHeader(startUtc, 'Europe/Berlin')).toBe('Montag, 6. Juli');
  });
});

describe('dayKey', () => {
  it('gruppiert nach Projekt-TZ-Kalendertag', () => {
    // 23:30 UTC = 01:30 nächster Tag in Berlin
    expect(dayKey('2026-07-06T23:30:00.000Z', 'Europe/Berlin')).toBe('2026-07-07');
    expect(dayKey('2026-07-06T23:30:00.000Z', 'UTC')).toBe('2026-07-06');
  });
});

describe('isNightHour', () => {
  it('22–06 = Nacht', () => {
    expect(isNightHour('2026-07-06T23:00:00.000Z', 'UTC')).toBe(true); // 23h
    expect(isNightHour('2026-07-06T03:00:00.000Z', 'UTC')).toBe(true); // 3h
    expect(isNightHour('2026-07-06T22:00:00.000Z', 'UTC')).toBe(true); // 22h
    expect(isNightHour('2026-07-06T06:00:00.000Z', 'UTC')).toBe(false); // 6h
    expect(isNightHour('2026-07-06T12:00:00.000Z', 'UTC')).toBe(false); // 12h
  });
});

describe('formatDualTz', () => {
  it('differs=false wenn Projekt-TZ == Browser-TZ', () => {
    const r = formatDualTz(startUtc, endUtc, 'UTC');
    expect(r.project).toBe('02–03');
    expect(typeof r.differs).toBe('boolean');
  });
});

describe('buildIcs', () => {
  it('erzeugt gültigen VEVENT-Rahmen mit UTC-Stempeln', () => {
    const ics = buildIcs({ startTime: startUtc, endTime: endUtc, title: 'Gebetsstunde' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20260706T020000Z');
    expect(ics).toContain('DTEND:20260706T030000Z');
    expect(ics).toContain('SUMMARY:Gebetsstunde');
    expect(ics).toContain('END:VCALENDAR');
  });
});
