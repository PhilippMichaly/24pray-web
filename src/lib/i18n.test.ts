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

// Bug 2026-10-28: „6 von 42 Tagen gehalten" auf der Einladung, obwohl alle Termine noch
// in der Zukunft lagen. Der Fortschritt zählt Zusagen (BOOKED+COMPLETED), nicht vergangene
// Gebetszeit — daher „übernommen" (Vokabular von „Stunde übernehmen"), nicht „gehalten".
describe('Fortschritt zählt Zusagen, nicht vergangene Gebetszeit', () => {
  const PROGRESS_KEYS = ['slotsBookedOf', 'slotsBookedOfRest', 'heldOfDays', 'slotsBookedOfRestDays'] as const;

  it('de: „übernommen" statt „gehalten"', () => {
    expect(translate('de', 'slotsBookedOf', { booked: 6, total: 42 })).toBe('6 von 42 Stunden übernommen');
    expect(translate('de', 'heldOfDays', { booked: 6, total: 42 })).toBe('6 von 42 Tagen übernommen');
    expect(translate('de', 'slotsBookedOfRest', { total: 42 })).toBe('von 42 Stunden übernommen');
    expect(translate('de', 'slotsBookedOfRestDays', { total: 42 })).toBe('von 42 Tagen übernommen');
  });

  it('keine Locale formuliert den Fortschritt in Vergangenheit („gehalten"/„held"/„הוחזקו")', () => {
    for (const l of SUPPORTED_LOCALES) {
      for (const k of PROGRESS_KEYS) {
        expect(translate(l, k, { booked: 1, total: 2 }), `${l}.${k}`).not.toMatch(/gehalten|held|הוחזקו/);
      }
    }
  });
});

describe('Einladung im Tages-Modus spricht von Tagen', () => {
  it('de: Lead und CTA haben eine Tages-Variante', () => {
    expect(tUnit(true, 'invitedToLead', 'invitedToLeadDay', { name: 'sarah' })).toBe(
      'sarah lädt dich ein, einen Tag zu übernehmen.',
    );
    expect(tUnit(true, 'toProjectTakeSlot', 'toProjectTakeSlotDay')).toBe('Zur Gebetswache & Tag übernehmen');
  });

  it('alle Locales: Tages-Varianten existieren und unterscheiden sich vom Stunden-Text', () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(translate(l, 'invitedToLeadDay', { name: 'x' }), l).not.toBe(translate(l, 'invitedToLead', { name: 'x' }));
      expect(translate(l, 'toProjectTakeSlotDay'), l).not.toBe(translate(l, 'toProjectTakeSlot'));
    }
  });
});

// Phase 2 (02-03 Task 2, D-08): alle neuen Texte der Karte „Ende der Wache“ in fünf Sprachen.
describe('Ende ändern (Phase 2) — neue Texte', () => {
  const NEW_KEYS = [
    'endCardTitle',
    'endCardCurrentEnd',
    'endCardCta',
    'endNewEndLabel',
    'endEditHint',
    'endEditHintDays',
    'endEditEarliest',
    'errEndCutsBooking',
    'errEndCutsBookingDays',
    'endConfirmButton',
    'endSaved',
  ] as const;

  it('errEndCutsBooking[Days] behalten {earliest} in jeder Locale', () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(translate(l, 'errEndCutsBooking', { earliest: 'XX' }), `${l}.errEndCutsBooking`).toContain('XX');
      expect(translate(l, 'errEndCutsBookingDays', { earliest: 'XX' }), `${l}.errEndCutsBookingDays`).toContain('XX');
    }
  });

  it('endCardCurrentEnd, endEditEarliest, endSaved behalten {date} in jeder Locale', () => {
    for (const l of SUPPORTED_LOCALES) {
      for (const k of ['endCardCurrentEnd', 'endEditEarliest', 'endSaved'] as const) {
        expect(translate(l, k, { date: 'XX' }), `${l}.${k}`).toContain('XX');
      }
    }
  });

  it('endCardTitle hat in jeder Locale höchstens 20 Zeichen (E3, bricht neben dem CTA um)', () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(translate(l, 'endCardTitle').length, `${l}.endCardTitle`).toBeLessThanOrEqual(20);
    }
  });

  it('alle 11 Texte existieren in jeder Locale (kein Fallback auf den Key)', () => {
    for (const l of SUPPORTED_LOCALES) {
      for (const k of NEW_KEYS) {
        const v = translate(l, k, { date: 'XX', earliest: 'XX' });
        expect(v, `${l}.${k}`).not.toBe(k);
        expect(v.length, `${l}.${k}`).toBeGreaterThan(0);
      }
    }
  });

  it('kein neuer Text spricht von „gehalten“/„held“/„הוחזקו“ (Vokabular „übernommen“)', () => {
    for (const l of SUPPORTED_LOCALES) {
      for (const k of NEW_KEYS) {
        expect(translate(l, k, { date: 'XX', earliest: 'XX' }), `${l}.${k}`).not.toMatch(/gehalten|held|הוחזקו/);
      }
    }
  });
});

// Regressionsschutz „Stunden-Wording in Tages-Wachen": existiert zu einem Key eine Tages-Variante
// (`<key>Day`/`<key>Days`), darf ihn keine Komponente mehr direkt per t('<key>') ziehen — sonst
// steht in einer Tages-Wache wieder „Stunde". Solche Stellen gehören hinter tUnit(...).
describe('Tages-Wachen: Stunden-Texte nur über tUnit', () => {
  const NEW_DAY_KEYS = [
    'notifyOnBookingHintDay', 'guestBookedTitleDay', 'inviteAfterBookingDay', 'inviteShareTextDay',
    'noStatsTitleDay', 'myLocationHintDay', 'emptySlotsTitleDay', 'emptySlotsHintDay',
    'scheduleWarningDay', 'projectDeleteWarningDay',
  ] as const;

  it('neue Tages-Texte sprechen in keiner Sprache mehr von Stunden', () => {
    const hourWord: Record<string, RegExp> = { de: /stunde/i, en: /hour/i, es: /hora/i, he: /שעה|שעות/, ar: /ساع/ };
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of NEW_DAY_KEYS) {
        const text = translate(locale, key, { title: 'X' });
        expect(text, `${locale}.${key}`).toBeTruthy();
        expect(text, `${locale}.${key}`).not.toMatch(hourWord[locale]);
      }
    }
  });

  it('kein direkter t()-Aufruf eines Keys, zu dem es eine Tages-Variante gibt', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const hasKey = (k: string) => typeof translate('de', k as never) === 'string';
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(p);
      }
    };
    walk(join(process.cwd(), 'src'));
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/(?<![\w.])t\(\s*'(\w+)'/g)) {
        const key = m[1];
        if (hasKey(`${key}Day`) || hasKey(`${key}Days`)) offenders.push(`${file.replace(process.cwd() + '/', '')}: t('${key}')`);
      }
    }
    // Bewusste Ausnahme: steht bereits in einem unit-Ternary mit eigener Parameterliste (days vs. hours).
    const ALLOWED = ["src/app/projects/new/page.tsx: t('summaryLine')"];
    expect(offenders.filter((o) => !ALLOWED.includes(o))).toEqual([]);
  });
});
