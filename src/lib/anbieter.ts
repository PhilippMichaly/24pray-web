/**
 * Anbieterkennzeichnung für Impressum + Datenschutzerklärung.
 * ⚠️ VOR DEM DEPLOY AUSFÜLLEN — einzige Stelle, beide Seiten lesen von hier.
 */
export const ANBIETER = {
  name: '[Vor- und Nachname eintragen]',
  strasse: '[Straße und Hausnummer eintragen]',
  ort: '[PLZ und Ort eintragen]',
  land: 'Deutschland',
  email: '[kontakt@24pray.org — E-Mail-Adresse bestätigen/ändern]',
};

/** true, solange die Platzhalter noch nicht ersetzt sind (zeigt Hinweisbanner). */
export const ANBIETER_UNVOLLSTAENDIG = Object.values(ANBIETER).some((v) => v.startsWith('['));
