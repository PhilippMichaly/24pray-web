// Clientseitige Validierung eines eigenen Endzeitpunkts (Phase 01 „Freie Zeiträume").
// Ausschließlich Millisekunden-Arithmetik ab dem Start — keine Kalenderrechnung
// (DST-freie Prüfung, identisch zur Preset-Arithmetik des Formulars, D-12).
// Der Fall 'missing' (leerer String) wird vor dem Aufruf in page.tsx behandelt.

/** Vier validierte Fehlerfälle (D-11), in fester Prüfreihenfolge. */
export type CustomEndError = 'missing' | 'notAfterStart' | 'tooLong' | 'notAligned';

export interface CustomEndValidation {
  key: CustomEndError;
  /** Nächstmöglicher gültiger Endzeitpunkt in ms — nur bei 'notAligned' (D-13). */
  exampleMs?: number;
}

/**
 * Prüft einen eigenen Endzeitpunkt gegen Start, 366-Tage-Grenze und Slot-Ausrichtung.
 * Vergleichsoperatoren identisch zur API (`span > 366 * 86_400_000` — exakt 366 Tage erlaubt).
 */
export function validateCustomEnd(
  startMs: number,
  endMs: number,
  slotMs: number,
): CustomEndValidation | null {
  const span = endMs - startMs;
  if (!(span > 0)) return { key: 'notAfterStart' };
  if (span > 366 * 86_400_000) return { key: 'tooLong' };
  if (span % slotMs !== 0) {
    return { key: 'notAligned', exampleMs: startMs + Math.ceil(span / slotMs) * slotMs };
  }
  return null;
}
