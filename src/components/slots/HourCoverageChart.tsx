'use client';

import { Moon } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { t } from '@/lib/i18n';

export interface HourCoverageChartProps {
  /** 24 Werte (Index = Tagesstunde 0–23), z. B. aus `coverageByHour`. */
  hours: number[];
}

const pad2 = (n: number) => n.toString().padStart(2, '0');
const isNightIndex = (h: number) => h >= 22 || h < 6;
// Bidi-Isolierung (LRI…PDI, U+2066/U+2069): der rohe Stunden-Bereich ("07–08") bleibt
// visuell LTR-geordnet, auch wenn er in einen RTL-Satz (he/ar) interpoliert wird — ohne
// die umgebende Übersetzung selbst in eine falsche Gesamtrichtung zu zwingen.
const ltrIsolate = (s: string) => `⁦${s}⁩`;

/** Farb-Slot (0..4) für einen Wert relativ zum Tagesmaximum. */
function rampIndex(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(4, Math.round((value / max) * 4)));
}

export function HourCoverageChart({ hours }: HourCoverageChartProps) {
  const max = Math.max(1, ...hours);
  const axisMarks = [0, 6, 12, 18, 24];

  return (
    <section aria-label={t('statsCoverageTitle')}>
      <h3 className="text-sm font-semibold text-ink">{t('statsCoverageTitle')}</h3>
      <div className="mt-4 flex h-24 items-end gap-[2px]">
        {hours.map((count, h) => {
          const idx = rampIndex(count, max);
          const heightPct = max > 0 ? Math.max(count > 0 ? 6 : 0, (count / max) * 100) : 0;
          const range = ltrIsolate(`${pad2(h)}–${pad2((h + 1) % 24)}`);
          return (
            <Tooltip
              key={h}
              content={<span className="tnum">{t('statsCoverageTooltip', { range, n: count })}</span>}
            >
              <button
                type="button"
                className="group flex h-full flex-1 flex-col items-center justify-end focus-visible:outline-none"
                aria-label={t('statsCoverageTooltip', { range, n: count })}
              >
                <span
                  className="w-full rounded-t-[4px] transition-[opacity] group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-focus"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: count > 0 ? 3 : 0,
                    backgroundColor: `var(--stats-ramp-${idx})`,
                  }}
                />
              </button>
            </Tooltip>
          );
        })}
      </div>
      {/* Mond-Tick: Nachtstunden 22–05 dezent markiert (Definition wie isNightHour). */}
      <div className="mt-1 flex gap-[2px]" aria-hidden>
        {hours.map((_, h) => (
          <div key={h} className="flex flex-1 justify-center">
            {isNightIndex(h) && <Moon size={8} className="text-night/50" />}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs tnum text-ink-muted" aria-hidden>
        {axisMarks.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </section>
  );
}
