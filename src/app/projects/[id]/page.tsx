'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectWithStats } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/patterns/AppShell';
import { TimezoneHint } from '@/components/patterns/TimezoneHint';
import { InviteCard } from '@/components/patterns/InviteCard';
import { LocationCard } from '@/components/patterns/LocationCard';
import { GroupLinksBar } from '@/components/patterns/GroupLinksBar';
import { ShareButton } from '@/components/patterns/ShareButton';
import { GroupLinksCard } from '@/components/patterns/GroupLinksCard';
import { ConcernCard } from '@/components/patterns/ConcernCard';
import { ScheduleCard } from '@/components/patterns/ScheduleCard';
import { ProjectDangerZone } from '@/components/patterns/ProjectDangerZone';
import { NextSlotCard } from '@/components/patterns/NextSlotCard';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FieldError } from '@/components/ui/Label';
import { CalendarPlus } from 'lucide-react';
import { useSlotGrid } from '@/components/slots/store';
import { ChainProgress } from '@/components/slots/ChainProgress';
import { ChainBand } from '@/components/slots/ChainBand';
import { SlotList } from '@/components/slots/SlotList';
import { SlotSheet, type SlotSheetMode } from '@/components/slots/SlotSheet';
import { RequestsFeed } from '@/components/slots/RequestsFeed';
import { StatsPanel } from '@/components/slots/StatsPanel';
import type { SlotViewModel } from '@/components/slots/types';
import { t } from '@/lib/i18n';

function ProjectPageInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const invite = searchParams.get('invite') ?? undefined; // PRIVATE-Kette per Einladungslink (W3)
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState('chain');
  const [sheet, setSheet] = useState<{ slot: SlotViewModel | null; mode: SlotSheetMode; open: boolean }>({
    slot: null,
    mode: 'info',
    open: false,
  });

  useEffect(() => {
    const q = invite ? `?invite=${encodeURIComponent(invite)}` : '';
    api
      .get<ProjectWithStats>(`/projects/${id}${q}`)
      .then(setProject)
      .catch((e) => setLoadError((e as Error).message));
  }, [id, invite]);

  const grid = useSlotGrid(project, currentUserId, invite);

  const scrollToSlot = useCallback((startTime: string) => {
    const el = document.getElementById(`s-${startTime}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.animate?.(
      [{ backgroundColor: 'hsl(var(--gold) / 0.25)' }, { backgroundColor: 'transparent' }],
      { duration: 900, easing: 'ease-out' },
    );
  }, []);

  const onBook = useCallback(
    (slot: SlotViewModel) => {
      if (currentUserId) {
        void grid.bookOptimistic(slot.key, user?.name ?? null);
      } else {
        setSheet({ slot, mode: 'guest-book', open: true });
      }
    },
    [currentUserId, grid, user?.name],
  );

  const onOpenSheet = useCallback((slot: SlotViewModel) => {
    const mine = slot.state === 'MINE' || slot.state === 'NOW_MINE';
    setSheet({ slot, mode: mine ? 'mine' : 'info', open: true });
  }, []);

  const inviteUrl = useMemo(() => {
    if (!project?.inviteToken || typeof window === 'undefined') return null;
    return `${window.location.origin}/join/${project.inviteToken}`;
  }, [project?.inviteToken]);

  const myNextSlot = useMemo(
    () => grid.models.find((m) => m.isMine && Date.parse(m.endTime) > grid.now),
    [grid.models, grid.now],
  );

  if (loadError) {
    return (
      <AppShell>
        <EmptyState
          icon={CalendarClock}
          title={loadError}
          action={{ label: t('exploreProjects'), href: '/dashboard' }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {!project ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <header className="mb-5">
            <h1 className="font-display text-2xl font-semibold text-ink">{project.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t('organizerLabel', { name: project.organizerName })}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <GroupLinksBar project={project} />
              <ShareButton
                project={project}
                isOrganizer={!!currentUserId && project.organizerId === currentUserId}
                inviteUrl={inviteUrl}
              />
            </div>
          </header>

          {/* Eine Kette = EIN Anliegen: die Beschreibung ist das Herzstück, nicht Beiwerk. */}
          {project.description && (
            <section className="mb-5 rounded-md border border-gold/30 bg-gold/5 px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('concernHeading')}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{project.description}</p>
            </section>
          )}

          <div className="mb-5">
            <ChainProgress
              booked={grid.booked}
              total={grid.total}
              largestGap={grid.gap.label ? { label: grid.gap.label, startTime: grid.gap.startTime! } : null}
              onGapClick={scrollToSlot}
              dayMode={grid.dayMode}
            />
            <div className="mt-3">
              <TimezoneHint projectTimezone={project.timezone} />
            </div>
          </div>

          {myNextSlot && (
            <div className="mb-5">
              <NextSlotCard
                slot={{
                  projectId: project.id,
                  projectTitle: project.title,
                  startTime: myNextSlot.startTime,
                  endTime: myNextSlot.endTime,
                }}
                projectTimezone={project.timezone}
                now={grid.now}
                dayMode={grid.dayMode}
              />
            </div>
          )}

          {inviteUrl && (
            <div className="mb-6 space-y-3">
              <LocationCard project={project} onUpdated={setProject} />
              <ConcernCard project={project} onUpdated={setProject} />
              <ScheduleCard project={project} onUpdated={setProject} />
              <GroupLinksCard project={project} onUpdated={setProject} />
              <InviteCard inviteUrl={inviteUrl} />
            </div>
          )}

          <Tabs
            value={tab}
            onValueChange={setTab}
            tabs={[
              { id: 'chain', label: t('chainTab') },
              { id: 'requests', label: t('requestsTab') },
              { id: 'stats', label: t('statsTab') },
            ]}
          >
            <TabPanel value="chain" className="pt-5">
              <FieldError>{grid.error}</FieldError>
              {grid.models.length === 0 ? (
                <EmptyState icon={CalendarPlus} title={t('emptySlotsTitle')} description={t('emptySlotsHint')} />
              ) : (
                <>
                  <div className="mb-6 overflow-x-auto">
                    <ChainBand
                      days={grid.days}
                      projectTz={grid.tz}
                      onCellActivate={scrollToSlot}
                      interactiveTooltip
                      dayMode={grid.dayMode}
                    />
                  </div>
                  <SlotList
                    days={grid.days}
                    projectTz={grid.tz}
                    onBook={onBook}
                    onOpenSheet={onOpenSheet}
                    gapStartTime={grid.gap.startTime}
                    gapCount={grid.gap.keys.size}
                    dayMode={grid.dayMode}
                  />
                </>
              )}
            </TabPanel>
            <TabPanel value="requests" className="pt-5">
              <RequestsFeed
                projectId={project.id}
                projectTz={grid.tz}
                isLoggedIn={!!currentUserId}
                isOrganizer={!!currentUserId && project.organizerId === currentUserId}
                invite={invite}
              />
            </TabPanel>
            <TabPanel value="stats" className="pt-5">
              <StatsPanel projectId={project.id} invite={invite} models={grid.models} tz={grid.tz} dayMode={grid.dayMode} />
            </TabPanel>
          </Tabs>

          <SlotSheet
            open={sheet.open}
            onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
            slot={sheet.slot}
            project={project}
            mode={sheet.mode}
            isOrganizer={!!currentUserId && project.organizerId === currentUserId}
            invite={invite}
            onCancel={async (guestToken) => {
              if (sheet.slot?.slotId) await grid.cancelBooked(sheet.slot.slotId, sheet.slot.key, guestToken);
            }}
            onGuestBooked={() => {
              // Sheet bleibt offen (Erfolgs-State + .ics im Formular); Grid im Hintergrund aktualisieren.
              void grid.reload();
            }}
            onRecurred={() => void grid.reload()}
          />

          {inviteUrl && (
            <div className="mt-8">
              <ProjectDangerZone projectId={project.id} />
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

export default function ProjectPage() {
  // useSearchParams braucht eine Suspense-Boundary (Next 14 Prerender).
  return (
    <Suspense fallback={null}>
      <ProjectPageInner />
    </Suspense>
  );
}
