'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { getProjectStats } from '@/lib/api';
import type { ProjectStats } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { t } from '@/lib/i18n';

export interface StatsPanelProps {
  projectId: string;
  invite?: string;
}

export function StatsPanel({ projectId, invite }: StatsPanelProps) {
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

  return (
    <div>
      <p className="font-display text-xl font-semibold text-ink tnum">
        {t('statsTotal', { hours: stats.completedHours })}
      </p>
      <ul className="mt-5 space-y-3">
        {stats.perPerson.map((p, i) => (
          <li key={`${p.name}-${i}`} className="flex items-center gap-3">
            <Avatar name={p.name} size="sm" />
            <span className="w-32 truncate text-sm text-ink">{p.name ?? '—'}</span>
            <span
              className="h-3 rounded-full bg-accent transition-all"
              style={{ width: `${Math.max(4, (p.hours / max) * 100)}%` }}
              aria-hidden
            />
            <span className="ml-auto shrink-0 text-sm tnum text-ink-muted">
              {t('statsHours', { hours: p.hours })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
