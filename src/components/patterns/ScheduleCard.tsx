'use client';

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { shiftProject } from '@/lib/api';
import type { ProjectWithStats } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from '@/components/ui/toast-store';
import { t, intlLocale } from '@/lib/i18n';

/** ISO → Wert für <input type="datetime-local"> (lokale Browser-Zeit, ohne Sekunden). */
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Startzeit der Wache verschieben (Ersteller-Lebenszyklus) — nur Organisator.
 * Muster wie ConcernCard: Anzeige-Zeile mit CTA, Edit-Modus mit Erklärung + Speichern.
 * Alle gebuchten Stunden wandern serverseitig per Delta mit; die API verschickt
 * Zeitplan-Mails an künftige Gebuchte — daher die deutliche Erklärung vor dem Speichern.
 */
export function ScheduleCard({
  project,
  onUpdated,
}: {
  project: ProjectWithStats;
  onUpdated: (p: ProjectWithStats) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(() => toDatetimeLocalValue(project.startDate));

  async function save() {
    setSaving(true);
    try {
      const newStartDate = new Date(value).toISOString();
      const updated = await shiftProject(project.id, newStartDate);
      onUpdated(updated);
      setEditing(false);
      toast({ message: t('scheduleSaved'), variant: 'positive' });
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  const formattedStart = new Intl.DateTimeFormat(intlLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(project.startDate));

  if (!editing) {
    return (
      <Card elevation={1} className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <CalendarClock size={18} className="shrink-0 text-accent-strong" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{t('scheduleCardTitle')}</p>
            <p className="truncate text-xs text-ink-muted">
              {t('scheduleCardCurrentStart', { date: formattedStart })}
            </p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          {t('scheduleCardCta')}
        </Button>
      </Card>
    );
  }

  return (
    <Card elevation={1} className="space-y-3">
      <p className="text-sm font-medium text-ink">{t('scheduleCardTitle')}</p>
      <div>
        <Label htmlFor="schedule-new-start">{t('scheduleNewStartLabel')}</Label>
        <Input
          id="schedule-new-start"
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <p className="text-xs text-ink-muted">{t('scheduleWarning')}</p>
      <div className="flex gap-2">
        <Button size="sm" loading={saving} onClick={save}>
          {t('scheduleConfirmButton')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          {t('cancel')}
        </Button>
      </div>
    </Card>
  );
}
