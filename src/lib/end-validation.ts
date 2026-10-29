// Clientseitige Validierung eines Endzeitpunkts — gemeinsame Quelle für Erstellen (Phase 01
// „Freie Zeiträume", app/projects/new/page.tsx) und Bearbeiten (Phase 02, EndDateCard).
// D-07: beide Formulare prüfen mit derselben Funktion, deshalb liegt sie in lib/ und nicht in
// einer Route (Pattern-Komponenten importieren nie aus app/).
// Ausschließlich Millisekunden-Arithmetik ab dem Start — keine Kalenderrechnung
// (DST-freie Prüfung, identisch zur Preset-Arithmetik des Formulars, D-12).
// Der Fall 'missing' (leerer String) behandeln die Aufrufer vor dem Aufruf.

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
