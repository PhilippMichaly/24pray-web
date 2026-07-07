'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderHeart } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { ProjectStatus, ProjectWithStats } from '@/types';
import { AppShell } from '@/components/patterns/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FieldError } from '@/components/ui/Label';
import { t } from '@/lib/i18n';

const statusMeta: Record<ProjectStatus, { variant: BadgeProps['variant']; key: string }> = {
  DRAFT: { variant: 'neutral', key: 'status_DRAFT' },
  ACTIVE: { variant: 'positive', key: 'status_ACTIVE' },
  PAUSED: { variant: 'neutral', key: 'status_PAUSED' },
  ARCHIVED: { variant: 'neutral', key: 'status_ARCHIVED' },
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const meta = statusMeta[status] ?? statusMeta.DRAFT;
  return <Badge variant={meta.variant}>{t(meta.key as never)}</Badge>;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ProjectWithStats[]>('/projects')
      .then(setProjects)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink">{t('yourProjects')}</h1>
        <Button asChild icon={Plus} size="sm">
          <Link href="/projects/new">{t('newProject')}</Link>
        </Button>
      </div>

      <FieldError>{error}</FieldError>

      {loading || projects === null ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !user ? (
        <EmptyState
          icon={FolderHeart}
          title={t('pleaseLogin', { login: t('login') })}
          action={{ label: t('login'), href: '/auth/login' }}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderHeart}
          title={t('noProjects')}
          description={t('noProjectsHint')}
          action={{ label: t('newProject'), href: '/projects/new' }}
        />
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Card elevation={1} className="transition-shadow hover:shadow-2">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-lg font-semibold text-ink">{p.title}</h2>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-muted tnum">
                    {t('slotsBookedOf', { booked: p.bookedSlots, total: p.totalSlots })}
                  </p>
                  <Progress
                    className="mt-3"
                    value={p.bookedSlots}
                    max={p.totalSlots}
                    aria-label={t('slotsBookedOf', { booked: p.bookedSlots, total: p.totalSlots })}
                  />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
