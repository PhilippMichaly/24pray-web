/**
 * Qualitätsstufen der WebGL-Erde für schwache Geräte — reine Funktionen, ohne DOM.
 * 0 = voll · 1 = Pixeldichte 1 · 2 = Pixeldichte 1 ohne Wolken und Bloom.
 * Es geht nur abwärts: ein Gerät, das einmal zu langsam war, wird nicht wieder hochgestuft.
 */
export type GlobeQuality = 0 | 1 | 2;

export const QUALITY_WINDOW_MS = 2000;
export const QUALITY_MIN_FPS = 25;

/** Nächste Stufe nach einem Messfenster mit `frames` Bildern in `windowMs` Millisekunden.
 *  Ein Fenster, das mehr als doppelt so lang wie vorgesehen dauerte, wird nicht gewertet —
 *  dann war der Tab verborgen, nicht das Gerät langsam. */
export function nextQuality(current: GlobeQuality, frames: number, windowMs: number): GlobeQuality {
  if (windowMs <= 0 || windowMs > QUALITY_WINDOW_MS * 2) return current;
  if ((frames * 1000) / windowMs >= QUALITY_MIN_FPS) return current;
  return current === 0 ? 1 : 2;
}

export function qualitySettings(
  q: GlobeQuality,
  devicePixelRatio: number,
): { dpr: number; clouds: boolean; bloom: boolean } {
  return {
    dpr: q === 0 ? Math.min(2, devicePixelRatio || 1) : 1,
    clouds: q < 2,
    bloom: q < 2,
  };
}
