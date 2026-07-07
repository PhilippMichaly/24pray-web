'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Moon } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectWithStats, SlotView } from '@/types';
import { AppShell } from '@/components/patterns/AppShell';
import { TimezoneHint } from '@/components/patterns/TimezoneHint';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { FieldError } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { dayKey, formatDayHeader, formatSlotRange, isNightHour } from '@/lib/time';
import { t } from '@/lib/i18n';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, s] = await Promise.all([
        api.get<ProjectWithStats>(`/projects/${id}`),
        api.get<SlotView[]>(`/projects/${id}/slots`),
      ]);
      setProject(p);
      setSlots(s);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function book(startTime: string) {
    setPending(startTime);
    try {
      await api.post(`/projects/${id}/slots`, { startTime, notifyChannel: 'EMAIL' });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  const tz = project?.timezone ?? 'UTC';
  const days = useMemo(() => {
    const map = new Map<string, SlotView[]>();
    for (const s of slots) {
      const key = dayKey(s.startTime, tz);
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return [...map.entries()];
  }, [slots, tz]);

  return (
    <AppShell>
      {!project ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-ink">{project.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{t('organizerLabel', { name: project.organizerName })}</p>
            <div className="mt-4">
              <p className="mb-2 font-display text-lg text-ink tnum">
                {t('slotsBookedOf', { booked: project.bookedSlots, total: project.totalSlots })}
              </p>
              <Progress value={project.bookedSlots} max={project.totalSlots} />
              <div className="mt-3">
                <TimezoneHint projectTimezone={project.timezone} />
              </div>
            </div>
          </div>

          <FieldError>{error}</FieldError>

          <div className="space-y-6">
            {days.map(([key, daySlots]) => (
              <section key={key}>
                <h2 className="sticky top-16 z-10 -mx-4 bg-bg/85 px-4 py-2 text-sm font-medium capitalize text-ink-muted backdrop-blur">
                  {formatDayHeader(daySlots[0].startTime, tz)}
                </h2>
                <ul className="mt-1 space-y-1.5">
                  {daySlots.map((s) => {
                    const night = isNightHour(s.startTime, tz);
                    const booked = s.status === 'BOOKED';
                    return (
                      <li
                        key={s.startTime}
                        className={cn(
                          'flex items-center gap-3 rounded-md border px-4 py-3',
                          booked ? 'bg-surface-sunken' : 'border-dashed bg-surface',
                        )}
                      >
                        <span className="flex w-16 items-center gap-1 text-sm tnum text-ink">
                          {night && <Moon size={13} className="text-night" aria-hidden />}
                          {formatSlotRange(s.startTime, s.endTime, tz)}
                        </span>
                        <span className="flex flex-1 items-center gap-2 text-sm">
                          {booked ? (
                            <>
                              <Avatar name={s.userName ?? null} size="sm" />
                              <span className="text-ink">{s.userName ?? '—'}</span>
                            </>
                          ) : (
                            <span className="text-ink-muted">{t('free')}</span>
                          )}
                        </span>
                        {!booked && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={pending === s.startTime}
                            onClick={() => book(s.startTime)}
                          >
                            {t('take')}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
