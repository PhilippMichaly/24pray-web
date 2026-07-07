// „Mein Ort" (W3.5): freiwillige, grobe Stadt-Koordinate des Beters.
// Lebt NUR im localStorage des Geräts; wird bei Buchungen (falls gesetzt)
// als reine Koordinate mitgeschickt — nie der Name.

import { matchCity, type City } from './cities';

const KEY = '24pray:mycity';

export function getMyCity(): City | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as City;
    return typeof c?.lat === 'number' && typeof c?.lon === 'number' ? c : null;
  } catch {
    return null;
  }
}

export function setMyCityByName(name: string): City | null {
  const city = matchCity(name);
  try {
    if (city) localStorage.setItem(KEY, JSON.stringify(city));
    else if (!name.trim()) localStorage.removeItem(KEY);
  } catch {
    /* localStorage blockiert → Ort bleibt einfach ungesetzt */
  }
  return city ?? null;
}

/** Koordinaten-Payload für Buchungen (leer wenn kein Ort gesetzt). */
export function myCityPayload(): { locationLat?: number; locationLon?: number } {
  const c = getMyCity();
  return c ? { locationLat: c.lat, locationLon: c.lon } : {};
}
