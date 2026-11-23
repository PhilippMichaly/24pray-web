/**
 * Sonnenstand für die Erde der Landing — reine Rechenfunktionen, ohne DOM.
 */

/** Punkt der Erde, über dem die Sonne gerade senkrecht steht (Näherung, Fehler < ~4°).
 *  `lon` liegt in [-180, 180). */
export function subsolarPoint(date: Date): { lat: number; lon: number } {
  const dayOfYear = (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86_400_000;
  const lat = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lon = ((((-15 * (hours - 12) + 180) % 360) + 360) % 360) - 180;
  return { lat, lon };
}

/** Längengrad, der beim Start in der Bildmitte steht: aus der Zeitzone des Besuchers
 *  (Normalzeit, 15° je Stunde), ohne Standortabfrage. Eingaben sind
 *  `Date#getTimezoneOffset()` vom 1. Januar und vom 1. Juli — der größere Wert ist die Normalzeit. */
export function startLongitude(offsetJanMin: number, offsetJulMin: number): number {
  const lon = -Math.max(offsetJanMin, offsetJulMin) / 4;
  return lon === 0 ? 0 : lon; // -0 → 0
}
