'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import type { ProjectStatus, ProjectWithStats } from '@/types';
import type { SlotViewModel } from '@/components/slots/types';
import { formatDayHeader } from '@/lib/time';
import { t } from '@/lib/i18n';

const statusMeta: Record<ProjectStatus, { variant: BadgeProps['variant']; key: string }> = {
  DRAFT: { variant: 'neutral', key: 'status_DRAFT' },
  ACTIVE: { variant: 'positive', key: 'status_ACTIVE' },
  PAUSED: { variant: 'neutral', key: 'status_PAUSED' },
  ARCHIVED: { variant: 'neutral', key: 'status_ARCHIVED' },
};

function cellColor(m: SlotViewModel): string {
  if (m.isMine) return 'bg-accent';
  if (m.status === 'BOOKED') return 'bg-accent/55';
  if (m.state === 'PAST') return 'bg-surface-sunken opacity-50';
  return 'bg-surface-sunken';
}

export interface ProjectCardProps {
  project: ProjectWithStats;
  models: SlotViewModel[];
}

// Mini-ChainBand: kompakter, nicht interaktiver Streifen (aggregiert, wrap).
export function ProjectCard({ project, models }: ProjectCardProps) {
  const meta = statusMeta[project.status as ProjectStatus] ?? statusMeta.DRAFT;
  const isActive = project.status === 'ACTIVE';
  // Bei sehr vielen Slots ausdünnen, damit der Streifen kompakt bleibt.
  const step = Math.max(1, Math.ceil(models.length / 96));
  const cells = models.filter((_, i) => i % step === 0);
  const showBand = project.bookedSlots > 0 && cells.length > 0;

  const untilLabel = t('untilDate', { date: formatDayHeader(project.endDate, project.timezone) });
  const metaLine = project.locationName ? `${project.locationName} · ${untilLabel}` : untilLabel;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <Card elevation={1} className="transition-shadow hover:shadow-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">{project.title}</h2>
          {/* Abweichung vom Standard (ACTIVE) ist die Information — nicht jede Karte braucht ein Label. */}
          {!isActive && <Badge variant={meta.variant}>{t(meta.key as never)}</Badge>}
        </div>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{project.description}</p>
        )}
        <p className="mt-1 text-sm text-ink-muted tnum">
          {t('slotsBookedOf', { booked: project.bookedSlots, total: project.totalSlots })}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">{metaLine}</p>
        {showBand && (
          <div className="mt-3 flex flex-wrap gap-[2px]" aria-hidden>
            {cells.map((m) => (
              <span key={m.key} className={cn('h-2 w-2 rounded-[2px]', cellColor(m))} />
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
