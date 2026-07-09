'use client';

import { t } from '@/lib/i18n';

/** Schwelle (Backlog 2, Kaltstart-Wahrnehmung): gilt für kumulierte Stunden UND aktive Wachen. */
export const STATS_MIN_VISIBLE = 5;

export interface LandingStatsProps {
  /** Kumulativ über alle Wachen: COMPLETED-Slots × Slot-Dauer, in Stunden. */
  completedHours: number;
  activeChains: number;
}

/**
 * Zahlen-Zeile der Landing: führt mit der kumulativen Gesamtleistung („Bereits N Stunden
 * gemeinsam gebetet") statt kleiner Live-Zahlen; unter der Schwelle lieber gar keine Zahl
 * als eine, die Leere signalisiert.
 */
export function LandingStats({ completedHours, activeChains }: LandingStatsProps) {
  if (completedHours < STATS_MIN_VISIBLE) return null;
  return (
    <p className="mt-5 text-sm text-gold tnum" aria-live="polite">
      {t('statsHoursPrayed', { n: Math.round(completedHours) })}
      {activeChains >= STATS_MIN_VISIBLE && <> · {t('statsChainsActive', { n: activeChains })}</>}
    </p>
  );
}
