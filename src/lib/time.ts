// Zentrale Datums-/Zeitformatierung (Vision §3.5, Spec §5, Fixpunkt 3).
// VERBOT von rohem toLocaleString()/toLocale…() im App-Code — alles läuft hierüber.

/** Stunde (0–23) eines ISO-Zeitpunkts in einer Ziel-Zeitzone. */
export function hourInTz(iso: string, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const h = parts.find((p) => p.type === 'hour')?.value ?? '0';
  // 'en-GB' liefert bei Mitternacht teils '24' → auf 0 normalisieren
  const n = parseInt(h, 10) % 24;
  return Number.isNaN(n) ? 0 : n;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** „02–03" — Start- bis End-Stunde in Projekt-Zeitzone (En-Dash). */
export function formatSlotRange(
  startISO: string,
  endISO: string,
  projectTz: string,
): string {
  return `${pad2(hourInTz(startISO, projectTz))}–${pad2(hourInTz(endISO, projectTz))}`;
}

import { intlLocale } from './i18n';

/** „Montag, 6. Juli" / "Monday, 6 July" — Tages-Header in Projekt-Zeitzone. */
export function formatDayHeader(dateISO: string, projectTz: string): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    timeZone: projectTz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(dateISO));
}

/** „Montag" / "Monday" — nur der Wochentag, für kollabierte Tages-Header (P2). */
export function formatWeekday(dateISO: string, projectTz: string): string {
  return new Intl.DateTimeFormat(intlLocale(), { timeZone: projectTz, weekday: 'long' }).format(new Date(dateISO));
}

/** ISO-Datum (YYYY-MM-DD) in Projekt-Zeitzone — Gruppierungsschlüssel je Tag. */
export function dayKey(dateISO: string, projectTz: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: projectTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(dateISO));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** „14. Juli" — Datum ohne Wochentag, für Tages-Modus-Wochenüberschriften. */
export function formatDateShort(dateISO: string, projectTz: string): string {
  return new Intl.DateTimeFormat(intlLocale(), { timeZone: projectTz, day: 'numeric', month: 'long' }).format(
    new Date(dateISO),
  );
}

/** „Mo 14.7." — Kurzform Wochentag+Datum, für Tages-Modus-Zeilen/-Zellen (Tages-Wachen). */
export function formatShortWeekdayDate(dateISO: string, projectTz: string): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    timeZone: projectTz,
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  }).format(new Date(dateISO));
}

/** Nachtstunde? 22:00–05:59 (inklusive) in Projekt-Zeitzone. */
export function isNightHour(startISO: string, projectTz: string): boolean {
  const h = hourInTz(startISO, projectTz);
  return h >= 22 || h < 6;
}

/** Zeitzone des Browsers. */
export function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin';
  } catch {
    return 'Europe/Berlin';
  }
}

/** Projekt- + lokale Zeit + ob sie abweichen (für TimezoneHint / Sheet). */
export function formatDualTz(
  startISO: string,
  endISO: string,
  projectTz: string,
): { project: string; local: string; differs: boolean } {
  const local = browserTz();
  return {
    project: formatSlotRange(startISO, endISO, projectTz),
    local: formatSlotRange(startISO, endISO, local),
    differs: local !== projectTz,
  };
}

/** ISO → iCalendar-UTC-Stempel (YYYYMMDDTHHMMSSZ). */
function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Minimaler RFC-5545 VEVENT als .ics-String (ein Slot). */
export function buildIcs(slot: {
  startTime: string;
  endTime: string;
  title: string;
  // Tages-Wache (slotDurationMinutes=1440): Ganztagestermin statt Uhrzeit-Termin.
  allDay?: boolean;
  projectTz?: string; // für die Ganztages-Datumsgrenze — Default UTC
}): string {
  const uid = `${icsStamp(slot.startTime)}-${Math.abs(hashStr(slot.title))}@24pray`;
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const tz = slot.projectTz ?? 'UTC';
  const dtstart = slot.allDay
    ? `DTSTART;VALUE=DATE:${dayKey(slot.startTime, tz).replace(/-/g, '')}`
    : `DTSTART:${icsStamp(slot.startTime)}`;
  const dtend = slot.allDay
    ? `DTEND;VALUE=DATE:${dayKey(slot.endTime, tz).replace(/-/g, '')}`
    : `DTEND:${icsStamp(slot.endTime)}`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//24pray//DE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(slot.startTime)}`,
    dtstart,
    dtend,
    `SUMMARY:${esc(slot.title)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
