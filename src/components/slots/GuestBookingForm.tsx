'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { formatDualTz, buildIcs, formatDayHeader } from '@/lib/time';
import { CityInput } from '@/components/patterns/CityInput';
import { setMyCity, getMyCity } from '@/lib/mylocation';
import type { GeoCity } from '@/lib/api';
import { t, tUnit } from '@/lib/i18n';
import type { SlotViewModel } from './types';

const GuestSchema = z.object({
  guestName: z.string().min(2, 'errNameRequired'),
  guestEmail: z.string().email('errEmailInvalid'),
});

export interface GuestBookingFormProps {
  slot: SlotViewModel;
  projectTitle: string;
  projectTz: string;
  /** Tages-Wache (slotDurationMinutes=1440): Ganztages-ICS + Tages-Texte statt Stunden. */
  dayMode?: boolean;
  onSubmit: (data: {
    guestName: string;
    guestEmail: string;
    locationLat?: number;
    locationLon?: number;
  }) => Promise<{ guestToken: string }>;
}

export function GuestBookingForm({ slot, projectTitle, projectTz, dayMode, onSubmit }: GuestBookingFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState<GeoCity | null>(() => getMyCity());
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const times = formatDualTz(slot.startTime, slot.endTime, projectTz);

  function downloadIcs() {
    const ics = buildIcs({
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: projectTitle,
      allDay: dayMode,
      projectTz,
    });
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
      // Ort ist freiwillig; merkt sich die Stadt fürs Gerät (W3.5)
      setMyCity(city);
      await onSubmit({
        ...parsed.data,
        ...(city ? { locationLat: city.lat, locationLon: city.lon } : {}),
      });
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
          {dayMode ? (
            formatDayHeader(slot.startTime, projectTz)
          ) : (
            <>
              {times.project} {t('oclock')}
              {times.differs && ` · ${t('atYou')} ${times.local}`}
            </>
          )}
        </p>
        <Button variant="secondary" icon={CalendarPlus} className="mt-4 w-full" onClick={downloadIcs}>
          {t('addToCalendar')}
        </Button>
        <p className="mt-4 text-xs text-ink-muted">
          {t('guestAccountOffer')}{' '}
          <Link href="/auth/login" className="text-accent-strong underline underline-offset-2">
            {t('login')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-md bg-surface-sunken px-3 py-2 text-sm tnum text-ink">
        {dayMode ? (
          formatDayHeader(slot.startTime, projectTz)
        ) : (
          <>
            {times.project} {t('oclock')}
            {times.differs && <span className="text-ink-muted"> · {t('atYou')} {times.local}</span>}
          </>
        )}
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
      <div>
        <Label htmlFor="guestCity">
          {t('fieldLocation')} <span className="text-ink-muted">({t('optional')})</span>
        </Label>
        <CityInput id="guestCity" initialName={getMyCity()?.name ?? ''} onSelect={setCity} />
        {!city && <p className="mt-1 text-xs text-ink-muted">{t('beterLocationHint')}</p>}
      </div>
      {/* Art.-9-Einwilligung + Namens-Sichtbarkeit (Gast-Buchung) */}
      <p className="text-xs leading-relaxed text-ink-muted">
        {t('consentGuest')}{' '}
        <a href="/datenschutz" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
          {t('privacyPolicy')}
        </a>
        .
      </p>
      <Button type="submit" loading={loading} className="w-full">
        {tUnit(!!dayMode, 'takeThisHour', 'takeThisDay')}
      </Button>
    </form>
  );
}
