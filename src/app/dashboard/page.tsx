'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderHeart } from 'lucide-react';
import { api, getSlotGrid } from '@/lib/api';
import { useFunnelPing } from '@/lib/funnel';
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
  useFunnelPing('list');
  const { user, loading } = useAuth();
  const [loaded, setLoaded] = useState<Loaded[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Eine Uhr pro Seitenaufruf — sonst rechnete jedes Re-Render die Einteilung neu.
  const [now] = useState(() => Date.now());

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

  // Laufende/geplante zuerst (nach Start), beendete getrennt darunter (neueste zuerst). Vorher stand
  // alles gemischt untereinander, und „bis Samstag, 11. Juli" verriet nicht, dass es vorbei ist.
  const { active, ended } = useMemo(() => {
    const all = loaded ?? [];
    const isEnded = (l: Loaded) => Date.parse(l.project.endDate) <= now;
    return {
      active: all.filter((l) => !isEnded(l)).sort((a, b) => Date.parse(a.project.startDate) - Date.parse(b.project.startDate)),
      ended: all.filter(isEnded).sort((a, b) => Date.parse(b.project.endDate) - Date.parse(a.project.endDate)),
    };
  }, [loaded, now]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {user ? t('yourProjects') : t('openChains')}
        </h1>
        {user ? (
          <Button asChild icon={Plus} size="sm" className="shrink-0 whitespace-nowrap">
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
          {active.length > 0 && (
            <section>
              {ended.length > 0 && (
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('dashActiveHeading')}</h2>
              )}
              <ul className="space-y-3">
                {active.map(({ project, models }) => (
                  <li key={project.id}>
                    <ProjectCard project={project} models={models} now={now} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {ended.length > 0 && (
            // Eingeklappt, sobald es Laufendes gibt — das Abgeschlossene ist Archiv, nicht Arbeit.
            <details open={active.length === 0} className="group">
              <summary className="mb-3 cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink">
                <span className="me-1 inline-block transition-transform group-open:rotate-90" aria-hidden>›</span>
                {t('dashEndedHeading', { n: ended.length })}
              </summary>
              <ul className="space-y-3">
                {ended.map(({ project, models }) => (
                  <li key={project.id}>
                    <ProjectCard project={project} models={models} now={now} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </AppShell>
  );
}
