import { describe, it, expect } from 'vitest';
import { t, tUnit } from './i18n';

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
