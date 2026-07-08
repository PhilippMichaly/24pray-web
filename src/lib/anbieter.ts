/**
 * Anbieterkennzeichnung für Impressum + Datenschutzerklärung.
 * ⚠️ VOR DEM DEPLOY AUSFÜLLEN — einzige Stelle, beide Seiten lesen von hier.
 */
export const ANBIETER = {
  name: 'Philipp Michaly',
  strasse: 'Über der Glonn 16',
  ort: '85238 Petershausen',
  land: 'Deutschland',
  email: 'info@24pray.org',
};

/** true, solange die Platzhalter noch nicht ersetzt sind (zeigt Hinweisbanner). */
export const ANBIETER_UNVOLLSTAENDIG = Object.values(ANBIETER).some((v) => v.startsWith('['));
