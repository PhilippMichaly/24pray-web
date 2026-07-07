'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { formatDualTz, buildIcs } from '@/lib/time';
import { t } from '@/lib/i18n';
import type { SlotViewModel } from './types';

const GuestSchema = z.object({
  guestName: z.string().min(2, 'errNameRequired'),
  guestEmail: z.string().email('errEmailInvalid'),
});

export interface GuestBookingFormProps {
  slot: SlotViewModel;
  projectTitle: string;
  projectTz: string;
  onSubmit: (data: { guestName: string; guestEmail: string }) => Promise<{ guestToken: string }>;
}

export function GuestBookingForm({ slot, projectTitle, projectTz, onSubmit }: GuestBookingFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const times = formatDualTz(slot.startTime, slot.endTime, projectTz);

  function downloadIcs() {
    const ics = buildIcs({ startTime: slot.startTime, endTime: slot.endTime, title: projectTitle });
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '24pray-slot.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = GuestSchema.safeParse({ guestName: name, guestEmail: email });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fe.guestName?.[0] ? t(fe.guestName[0] as never) : undefined,
        email: fe.guestEmail?.[0] ? t(fe.guestEmail[0] as never) : undefined,
      });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await onSubmit(parsed.data);
      setDone(true);
    } catch {
      setErrors({ email: t('bookGenericError') });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-positive/15 text-positive">
          <CheckCircle2 size={24} />
        </span>
        <p className="font-display text-lg font-semibold text-ink">{t('guestBookedTitle')}</p>
        <p className="mt-1 text-sm text-ink-muted tnum">
          {times.project} {t('oclock')}
          {times.differs && ` · ${t('atYou')} ${times.local}`}
        </p>
        <Button variant="secondary" icon={CalendarPlus} className="mt-4 w-full" onClick={downloadIcs}>
          {t('addToCalendar')}
        </Button>
        <p className="mt-4 text-xs text-ink-muted">
          {t('guestAccountOffer')}{' '}
          <Link href="/auth/login" className="text-accent underline underline-offset-2">
            {t('login')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-md bg-surface-sunken px-3 py-2 text-sm tnum text-ink">
        {times.project} {t('oclock')}
        {times.differs && <span className="text-ink-muted"> · {t('atYou')} {times.local}</span>}
      </div>
      <div>
        <Label htmlFor="guestName">{t('name')}</Label>
        <Input
          id="guestName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={!!errors.name}
          autoComplete="name"
        />
        <FieldError>{errors.name}</FieldError>
      </div>
      <div>
        <Label htmlFor="guestEmail">{t('emailForReminder')}</Label>
        <Input
          id="guestEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={!!errors.email}
          autoComplete="email"
        />
        <FieldError>{errors.email}</FieldError>
      </div>
      <Button type="submit" loading={loading} className="w-full">
        {t('takeThisHour')}
      </Button>
    </form>
  );
}
