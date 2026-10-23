import { describe, it, expect } from 'vitest';
import { t, tUnit, translate, SUPPORTED_LOCALES } from './i18n';

describe('tUnit — zentrale Stunden/Tage-Textwahl (Tages-Modus)', () => {
  it('liefert den Stunden-Key, wenn nicht im Tages-Modus', () => {
    expect(tUnit(false, 'yourHourTitle', 'yourDayTitle')).toBe(t('yourHourTitle'));
  });
  it('liefert den Tages-Key im Tages-Modus', () => {
    expect(tUnit(true, 'yourHourTitle', 'yourDayTitle')).toBe(t('yourDayTitle'));
  });
  it('reicht Interpolations-Parameter durch', () => {
    expect(tUnit(true, 'pastFoldLabel', 'pastFoldLabelDays', { n: 3 })).toBe(t('pastFoldLabelDays', { n: 3 }));
  });
});

// Final-Review Important 2 und 4: Texte müssen in allen fünf Locales nachgezogen sein.
const OLD_ROTATE_CONFIRM = [
  'Der alte Link funktioniert danach nicht mehr. Bisherige Mitglieder behalten ihren Zugang.',
  'The old link will stop working. Existing members keep access.',
  'El enlace anterior dejará de funcionar. Los miembros actuales conservan su acceso.',
  'הקישור הישן יפסיק לפעול. החברים הקיימים ישמרו על הגישה שלהם.',
  'سيتوقف الرابط القديم عن العمل. يحتفظ الأعضاء الحاليون بإمكانية الوصول.',
];

describe('Invite-Rotation und Verify-Hinweis in allen Locales', () => {
  it('inviteRotateConfirm erwähnt Gäste ohne Konto (nicht mehr der alte Text)', () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(OLD_ROTATE_CONFIRM).not.toContain(translate(l, 'inviteRotateConfirm'));
    }
    expect(translate('de', 'inviteRotateConfirm')).toBe(
      'Der alte Link funktioniert danach nicht mehr. Mitglieder mit Konto behalten ihren Zugang – Gäste ohne Konto brauchen den neuen Link.',
    );
  });

  it('linkIncomplete nennt den 6-stelligen Code als Ausweg', () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(translate(l, 'linkIncomplete')).toMatch(/6/);
    }
    expect(translate('de', 'linkIncomplete')).toBe(
      'Der Link ist unvollständig. Öffne ihn bitte noch einmal direkt aus der E-Mail – oder gib auf der Anmeldeseite den 6-stelligen Code aus derselben Mail ein.',
    );
  });
});
