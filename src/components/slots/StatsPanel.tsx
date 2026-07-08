'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { getProjectStats } from '@/lib/api';
import type { ProjectStats } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { t } from '@/lib/i18n';
import { HourCoverageChart } from './HourCoverageChart';
import { coverageByHour } from './logic';
import type { SlotViewModel } from './types';

export interface StatsPanelProps {
  projectId: string;
  invite?: string;
  /** Für die „Wache über den Tag"-Ableitung (Stunden-Abdeckung, dataviz-Skill). */
  models: SlotViewModel[];
  tz: string;
}

export function StatsPanel({ projectId, invite, models, tz }: StatsPanelProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProjectStats(projectId, invite)
      .then(setStats)
      .catch(() => setError(true));
  }, [projectId, invite]);

  if (error) return <EmptyState icon={BarChart3} title={t('statsError')} />;
  if (!stats) return <Skeleton className="h-48 w-full" />;
  if (stats.perPerson.length === 0) {
    return <EmptyState icon={BarChart3} title={t('noStatsTitle')} description={t('noStatsHint')} />;
  }

  const max = Math.max(...stats.perPerson.map((p) => p.hours));
  const hourly = coverageByHour(models, tz);

  return (
    <div className="space-y-8">
      {/* Hero-Zahl — die eine Kennzahl, die diese Ansicht anführt. */}
      <div>
        <p className="font-display text-4xl font-semibold text-accent-strong tnum">{stats.completedHours}</p>
        <p className="mt-1 text-sm text-ink-muted">{t('statsHeroLabel')}</p>
      </div>

      <HourCoverageChart hours={hourly} />

      <section aria-label={t('statsWhoTitle')}>
        <h3 className="text-sm font-semibold text-ink">{t('statsWhoTitle')}</h3>
        <table className="mt-4 w-full border-collapse">
          <caption className="sr-only">{t('statsWhoTitle')}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">{t('statsWhoColPerson')}</th>
              <th scope="col">{t('statsWhoColHours')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.perPerson.map((p, i) => (
              <tr key={`${p.name}-${i}`}>
                <td className="py-1.5 pr-3 align-middle">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="sm" />
                    <span className="max-w-[9rem] truncate text-sm text-ink">{p.name ?? '—'}</span>
                  </div>
                </td>
                <td className="w-full py-1.5 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="h-3 flex-1">
                      <div
                        className="h-3 bg-accent"
                        style={{
                          width: `${Math.max(4, (p.hours / max) * 100)}%`,
                          borderRadius: '0 4px 4px 0',
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm tnum text-ink-muted">
                      {t('statsHours', { hours: p.hours })}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
