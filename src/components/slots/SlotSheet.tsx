'use client';

import { useState } from 'react';
import { Moon } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { GuestBookingForm } from './GuestBookingForm';
import { bookSlot } from '@/lib/api';
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
}

const guestTokenKey = (slotId: string) => `24pray:guest:${slotId}`;

export function SlotSheet({ open, onOpenChange, slot, project, mode, onCancel, onGuestBooked }: SlotSheetProps) {
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
