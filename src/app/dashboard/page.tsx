'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderHeart } from 'lucide-react';
import { api, getSlotGrid } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { ProjectWithStats } from '@/types';
import { AppShell } from '@/components/patterns/AppShell';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FieldError } from '@/components/ui/Label';
import { ProjectCard } from '@/components/patterns/ProjectCard';
import { NextSlotCard } from '@/components/patterns/NextSlotCard';
import { buildViewModels } from '@/components/slots/logic';
import type { SlotViewModel } from '@/components/slots/types';
import { t } from '@/lib/i18n';

interface Loaded {
  project: ProjectWithStats;
  models: SlotViewModel[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [loaded, setLoaded] = useState<Loaded[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = Date.now();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const projects = await api.get<ProjectWithStats[]>('/projects');
        const withGrids = await Promise.all(
          projects.map(async (project) => {
            const slots = await getSlotGrid(project.id).catch(() => []);
            const { models } = buildViewModels(slots, {
              now: Date.now(),
              projectTz: project.timezone,
              pendingKeys: new Set(),
              conflictKey: null,
            });
            return { project, models };
          }),
        );
        if (!cancelled) setLoaded(withGrids);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nächste eigene Stunde über alle Ketten hinweg.
  const nextSlot = useMemo(() => {
    if (!loaded) return null;
    const mine = loaded
      .flatMap((l) => l.models.map((m) => ({ m, project: l.project })))
      .filter(({ m }) => m.isMine && Date.parse(m.endTime) > now)
      .sort((a, b) => Date.parse(a.m.startTime) - Date.parse(b.m.startTime));
    return mine[0] ?? null;
  }, [loaded, now]);

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {user ? t('yourProjects') : t('openChains')}
        </h1>
        {user ? (
          <Button asChild icon={Plus} size="sm">
            <Link href="/projects/new">{t('newProject')}</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="secondary">
            <Link href="/auth/login">{t('login')}</Link>
          </Button>
        )}
      </div>

      {/* Offene (PUBLIC) Ketten sind ohne Konto sichtbar — Mitbeten braucht keinen Account (F4). */}
      {!user && <p className="mb-4 text-sm text-ink-muted">{t('openChainsHint')}</p>}

      <FieldError>{error}</FieldError>

      {loading || loaded === null ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : !user && loaded.length === 0 ? (
        <EmptyState
          icon={FolderHeart}
          title={t('pleaseLogin', { login: t('login') })}
          action={{ label: t('login'), href: '/auth/login' }}
        />
      ) : loaded.length === 0 ? (
        <EmptyState
          icon={FolderHeart}
          title={t('noProjects')}
          description={t('noProjectsHint')}
          action={{ label: t('newProject'), href: '/projects/new' }}
        />
      ) : (
        <div className="space-y-6">
          {nextSlot && (
            <NextSlotCard
              slot={{
                projectId: nextSlot.project.id,
                projectTitle: nextSlot.project.title,
                startTime: nextSlot.m.startTime,
                endTime: nextSlot.m.endTime,
              }}
              projectTimezone={nextSlot.project.timezone}
              now={now}
            />
          )}
          <ul className="space-y-3">
            {loaded.map(({ project, models }) => (
              <li key={project.id}>
                <ProjectCard project={project} models={models} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
