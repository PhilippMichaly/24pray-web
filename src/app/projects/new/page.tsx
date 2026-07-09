'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Lock, Check, Clock, CalendarDays } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { ProjectVisibility, ProjectWithStats } from '@/types';
import { AppShell } from '@/components/patterns/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { EmptyState } from '@/components/ui/EmptyState';
import { FolderHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { browserTz, formatDayHeader } from '@/lib/time';
import { CityInput } from '@/components/patterns/CityInput';
import type { GeoCity } from '@/lib/api';
import { t, getLocale } from '@/lib/i18n';

type SplitUnit = 'hour' | 'day';

const HOUR_DURATIONS = [
  { hours: 24, key: 'duration24' },
  { hours: 48, key: 'duration48' },
  { hours: 72, key: 'duration72' },
  { hours: 168, key: 'durationWeek' },
] as const;

// Tages-Wachen laufen typischerweise über Wochen — Presets in ganzen Wochen + 40 Tage
// (Wert bleibt intern weiter „hours", da endDate = startDate + hours*3600_000 unverändert gilt).
const DAY_DURATIONS = [
  { hours: 168, key: 'durationWeek' },
  { hours: 336, key: 'duration2Weeks' },
  { hours: 672, key: 'duration4Weeks' },
  { hours: 960, key: 'duration40Days' },
] as const;

export default function NewProjectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [unit, setUnit] = useState<SplitUnit>('hour'); // Wählbare Aufteilung: Stunden oder ganze Tage
  const [hours, setHours] = useState<number>(48);
  const [visibility, setVisibility] = useState<ProjectVisibility>('PRIVATE');
  const [maskNames, setMaskNames] = useState(false); // Opt-in (§E5-Revision): Default Klartext
  const [notifyOnBooking, setNotifyOnBooking] = useState(true); // Default an (Punkt 10)
  const [links, setLinks] = useState({ linkWhatsapp: '', linkTelegram: '', linkSignal: '' });
  const [selectedCity, setSelectedCity] = useState<GeoCity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tz = browserTz();
  const durations = unit === 'day' ? DAY_DURATIONS : HOUR_DURATIONS;
  const slotDurationMinutes = unit === 'day' ? 1440 : 60;
  const endIso = useMemo(() => {
    if (!startDate) return null;
    return new Date(new Date(startDate).getTime() + hours * 3600_000).toISOString();
  }, [startDate, hours]);

  function selectUnit(next: SplitUnit) {
    setUnit(next);
    // Presets wechseln komplett (24h/48h/... vs. 1/2/4 Wochen/40 Tage) — erstes Preset der neuen Liste greifen.
    setHours((next === 'day' ? DAY_DURATIONS : HOUR_DURATIONS)[0].hours);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startDate) return setError(t('errDatesRequired'));
    const start = new Date(startDate);
    setSubmitting(true);
    try {
      const city = selectedCity;
      const project = await api.post<ProjectWithStats>('/projects', {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + hours * 3600_000).toISOString(),
        timezone: tz,
        language: getLocale(), // Wachen-Sprache = UI-Sprache beim Anlegen (Backlog 5), wie tz still erfasst
        slotDurationMinutes,
        visibility,
        maskNames,
        notifyOnBooking,
        ...(links.linkWhatsapp.trim() ? { linkWhatsapp: links.linkWhatsapp.trim() } : {}),
        ...(links.linkTelegram.trim() ? { linkTelegram: links.linkTelegram.trim() } : {}),
        ...(links.linkSignal.trim() ? { linkSignal: links.linkSignal.trim() } : {}),
        ...(city
          ? { locationName: city.name, locationLat: city.lat, locationLon: city.lon }
          : {}),
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (loading) return <AppShell>{null}</AppShell>;
  if (!user) {
    return (
      <AppShell>
        <EmptyState
          icon={FolderHeart}
          title={t('pleaseLogin', { login: t('login') })}
          action={{ label: t('login'), href: '/auth/login' }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold text-ink">{t('newProjectTitle')}</h1>
        <span className="ms-auto text-sm tnum text-ink-muted">{step}/2</span>
      </div>

      <Card elevation={1}>
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <Label htmlFor="title">{t('fieldTitle')}</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('fieldTitlePlaceholder')} />
            </div>
            <div>
              <Label htmlFor="description">
                {t('fieldDescription')} <span className="text-ink-muted">({t('optional')})</span>
              </Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <FieldError>{!title.trim() && error ? t('errTitleRequired') : null}</FieldError>
            <Button
              onClick={() => {
                if (!title.trim()) return setError(t('errTitleRequired'));
                setError(null);
                setStep(2);
              }}
            >
              {t('stepNext')}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <Label htmlFor="startDate">{t('fieldStart')}</Label>
              <Input id="startDate" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              {unit === 'day' && (
                <p className="mt-1 text-xs text-ink-muted">
                  {t('dayRunsHint', { start: startDate ? startDate.slice(11, 16) : '00:00' })}
                </p>
              )}
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-muted">{t('splitLabel')}</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {([
                  ['hour', Clock, 'splitHours', 'splitHoursDesc'],
                  ['day', CalendarDays, 'splitDays', 'splitDaysDesc'],
                ] as const).map(([value, Icon, labelKey, descKey]) => {
                  const active = unit === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectUnit(value)}
                      className={cn(
                        'flex items-start gap-2 rounded-md border px-3 py-3 text-start transition-colors',
                        active ? 'border-accent bg-accent-soft' : 'bg-surface hover:bg-surface-sunken',
                      )}
                    >
                      <Icon size={18} className={active ? 'text-accent-strong' : 'text-ink-muted'} aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm text-ink">{t(labelKey)}</span>
                        <span className="block text-xs text-ink-muted">{t(descKey)}</span>
                      </span>
                      {active && <Check size={16} className="ms-auto shrink-0 text-accent-strong" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="dur">{t('durationLabel')}</Label>
              <div id="dur" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {durations.map((d) => (
                  <button
                    key={d.hours}
                    type="button"
                    onClick={() => setHours(d.hours)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm transition-colors',
                      hours === d.hours
                        ? 'border-accent bg-accent-soft text-accent-strong'
                        : 'bg-surface text-ink-muted hover:bg-surface-sunken',
                    )}
                  >
                    {t(d.key as never)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="location">
                {t('fieldLocation')} <span className="text-ink-muted">({t('optional')})</span>
              </Label>
              <CityInput id="location" onSelect={setSelectedCity} />
              {!selectedCity && <p className="mt-1 text-xs text-ink-muted">{t('fieldLocationHint')}</p>}
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-muted">{t('fieldVisibility')}</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(['PRIVATE', 'PUBLIC'] as const).map((v) => {
                  const active = visibility === v;
                  const Icon = v === 'PRIVATE' ? Lock : Globe;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibility(v)}
                      className={cn(
                        'flex items-start gap-2 rounded-md border px-3 py-3 text-start transition-colors',
                        active ? 'border-accent bg-accent-soft' : 'bg-surface hover:bg-surface-sunken',
                      )}
                    >
                      <Icon size={18} className={active ? 'text-accent-strong' : 'text-ink-muted'} aria-hidden />
                      <span className="text-sm text-ink">
                        {v === 'PRIVATE' ? t('visibilityPrivate') : t('visibilityPublic')}
                      </span>
                      {active && <Check size={16} className="ms-auto text-accent-strong" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border bg-surface px-3 py-3">
              <input
                type="checkbox"
                checked={maskNames}
                onChange={(e) => setMaskNames(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[hsl(var(--accent))]"
              />
              <span className="min-w-0">
                <span className="block text-sm text-ink">{t('maskNamesLabel')}</span>
                <span className="block text-xs text-ink-muted">{t('maskNamesHint')}</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border bg-surface px-3 py-3">
              <input
                type="checkbox"
                checked={notifyOnBooking}
                onChange={(e) => setNotifyOnBooking(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[hsl(var(--accent))]"
              />
              <span className="min-w-0">
                <span className="block text-sm text-ink">{t('notifyOnBookingLabel')}</span>
                <span className="block text-xs text-ink-muted">{t('notifyOnBookingHint')}</span>
              </span>
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-muted">{t('groupLinksTitle')}</span>
              <p className="mb-2 text-xs text-ink-muted">{t('groupLinksHint')}</p>
              <div className="space-y-2">
                {([
                  ['linkWhatsapp', 'WhatsApp', 'https://chat.whatsapp.com/…'],
                  ['linkTelegram', 'Telegram', 'https://t.me/…'],
                  ['linkSignal', 'Signal', 'https://signal.group/…'],
                ] as const).map(([key, label, ph]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-sm text-ink">{label}</span>
                    <Input
                      aria-label={label}
                      type="url"
                      value={links[key]}
                      onChange={(e) => setLinks((l) => ({ ...l, [key]: e.target.value }))}
                      placeholder={ph}
                    />
                  </div>
                ))}
              </div>
            </div>

            {startDate && endIso && (
              <div className="rounded-md bg-surface-sunken px-3 py-2 text-sm text-ink-muted tnum">
                {unit === 'day'
                  ? t('summaryLineDays', {
                      days: hours / 24,
                      start: formatDayHeader(new Date(startDate).toISOString(), tz),
                    })
                  : t('summaryLine', {
                      hours,
                      start: formatDayHeader(new Date(startDate).toISOString(), tz),
                    })}
              </div>
            )}

            <FieldError>{error}</FieldError>

            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                {t('stepBack')}
              </Button>
              <Button type="submit" loading={submitting} className="ms-auto">
                {submitting ? t('creating') : t('createProject')}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {step === 1 && (
        <div className="mt-4">
          <Link href="/dashboard" className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink">
            {t('cancel')}
          </Link>
        </div>
      )}
    </AppShell>
  );
}
