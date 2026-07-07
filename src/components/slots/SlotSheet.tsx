'use client';

import { useEffect, useState } from 'react';
import { Moon, Repeat, BellRing } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Input';
import { toast } from '@/components/ui/toast-store';
import { GuestBookingForm } from './GuestBookingForm';
import { bookSlot, recurSlot, getReminderPref, putReminderPref } from '@/lib/api';
import { formatDualTz } from '@/lib/time';
import { t } from '@/lib/i18n';
import type { ProjectWithStats } from '@/types';
import type { SlotViewModel } from './types';

export type SlotSheetMode = 'info' | 'mine' | 'guest-book';

export interface SlotSheetProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  slot: SlotViewModel | null;
  project: ProjectWithStats;
  mode: SlotSheetMode;
  onCancel?: () => Promise<void> | void; // Storno (mode='mine')
  onGuestBooked?: (slotId: string, guestToken: string) => void;
  onRecurred?: () => void; // Grid neu laden nach „Jede Woche" (W3)
}

/** W3: Recurring + Reminder — Andockpunkte im mine-Modus. */
function MineExtras({ slot, project, onRecurred }: { slot: SlotViewModel; project: ProjectWithStats; onRecurred?: () => void }) {
  const [recurring, setRecurring] = useState(false);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    getReminderPref().then((p) => setMinutes(p.minutesBefore)).catch(() => setMinutes(60));
  }, []);

  const projectSpanMs = Date.parse(project.endDate) - Date.parse(project.startDate);
  const WEEK = 7 * 24 * 3600_000;

  async function recur() {
    if (!slot.slotId) return;
    setRecurring(true);
    try {
      const res = await recurSlot(slot.slotId);
      toast({
        message: res.createdSlotIds.length
          ? t('everyWeekDone', { n: res.createdSlotIds.length })
          : t('everyWeekNone'),
        variant: 'positive',
      });
      onRecurred?.();
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'danger' });
    } finally {
      setRecurring(false);
    }
  }

  async function saveMinutes(v: number) {
    setMinutes(v);
    setEditing(false);
    try {
      await putReminderPref(v);
      toast({ message: t('reminderSaved'), variant: 'positive' });
    } catch {
      /* Preference ist Komfort — Fehler still lassen */
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      {projectSpanMs > WEEK && (
        <Button variant="secondary" size="sm" icon={Repeat} loading={recurring} onClick={recur}>
          {t('everyWeek')}
        </Button>
      )}
      {minutes !== null && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <BellRing size={15} className="shrink-0 text-accent" aria-hidden />
          {editing ? (
            <Select
              value={minutes}
              onChange={(e) => void saveMinutes(Number(e.target.value))}
              className="w-auto py-1.5 text-sm"
              aria-label={t('reminderChange')}
            >
              {[15, 30, 60, 120].map((m) => (
                <option key={m} value={m}>{m} Min.</option>
              ))}
            </Select>
          ) : (
            <>
              <span>{t('reminderNote', { min: minutes })}</span>
              <button onClick={() => setEditing(true)} className="text-accent-strong underline underline-offset-2">
                {t('reminderChange')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const guestTokenKey = (slotId: string) => `24pray:guest:${slotId}`;

export function SlotSheet({ open, onOpenChange, slot, project, mode, onCancel, onGuestBooked, onRecurred }: SlotSheetProps) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!slot) return null;
  const times = formatDualTz(slot.startTime, slot.endTime, project.timezone);

  const TimeBlock = (
    <div className="flex items-center gap-2 text-sm tnum text-ink">
      {slot.isNight && <Moon size={14} className="text-night" aria-hidden />}
      <span>
        {times.project} {t('oclock')}
        {times.differs && <span className="text-ink-muted"> · {t('atYou')} {times.local}</span>}
      </span>
    </div>
  );

  const title =
    mode === 'guest-book' ? t('takeHourTitle') : mode === 'mine' ? t('yourHourTitle') : t('hourTitle');

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="space-y-4">
        {TimeBlock}
        {slot.isNight && <p className="text-xs text-night">{t('nightWatch')}</p>}

        {mode === 'info' && slot.userName && (
          <div className="flex items-center gap-3 rounded-md bg-surface-sunken px-3 py-2.5">
            <Avatar name={slot.userName} size="md" />
            <span className="text-sm text-ink">{slot.userName}</span>
          </div>
        )}

        {mode === 'mine' && <MineExtras slot={slot} project={project} onRecurred={onRecurred} />}

        {mode === 'mine' && (
          <div className="pt-2">
            {confirming ? (
              <div className="space-y-3">
                <p className="text-sm text-ink-muted">{t('releaseConfirm')}</p>
                <div className="flex gap-2">
                  <Button
                    variant="danger-fill"
                    loading={cancelling}
                    onClick={async () => {
                      setCancelling(true);
                      await onCancel?.();
                      setCancelling(false);
                      onOpenChange(false);
                    }}
                  >
                    {t('releaseHour')}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirming(false)}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setConfirming(true)}>
                {t('releaseHour')}
              </Button>
            )}
          </div>
        )}

        {mode === 'guest-book' && (
          <GuestBookingForm
            slot={slot}
            projectTitle={project.title}
            projectTz={project.timezone}
            onSubmit={async (data) => {
              const created = await bookSlot(project.id, {
                startTime: slot.startTime,
                guestName: data.guestName,
                guestEmail: data.guestEmail,
              });
              const guestToken = created.guestToken ?? '';
              if (guestToken) {
                try {
                  localStorage.setItem(guestTokenKey(created.id), guestToken);
                } catch {
                  /* localStorage kann blockiert sein — Storno dann nur serverseitig */
                }
              }
              onGuestBooked?.(created.id, guestToken);
              return { guestToken };
            }}
          />
        )}
      </div>
    </Sheet>
  );
}
