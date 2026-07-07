'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectWithStats } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/toast-store';
import { CITIES, matchCity } from '@/lib/cities';
import { t } from '@/lib/i18n';

/**
 * Ort der Kette nachträglich setzen/ändern (nur Organizer, W3.5-Fix).
 * Ohne Ort leuchtet die Kette nicht auf der Weltkugel — und die Beter-Linien
 * haben keinen Ankerpunkt.
 */
export function LocationCard({
  project,
  onUpdated,
}: {
  project: ProjectWithStats;
  onUpdated: (p: ProjectWithStats) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(project.locationName ?? '');
  const [saving, setSaving] = useState(false);
  const match = matchCity(input);

  async function save() {
    if (!match) return;
    setSaving(true);
    try {
      const updated = await api.patch<ProjectWithStats>(`/projects/${project.id}`, {
        locationName: match.name,
        locationLat: match.lat,
        locationLon: match.lon,
      });
      onUpdated(updated);
      setEditing(false);
      toast({ message: t('locationSaved', { city: match.name }), variant: 'positive' });
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  if (!editing && project.locationName) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
        <MapPin size={14} className="text-accent-strong" aria-hidden />
        {project.locationName}
        <button onClick={() => setEditing(true)} className="text-accent-strong underline underline-offset-2">
          {t('reminderChange')}
        </button>
      </p>
    );
  }

  if (!editing) {
    // Kein Ort gesetzt → aktive Einladung, das Licht anzumachen
    return (
      <Card elevation={1} className="border-gold/40 bg-gold/10">
        <div className="flex items-center gap-2 text-ink">
          <MapPin size={16} className="text-accent-strong" aria-hidden />
          <h3 className="text-sm font-semibold">{t('noLocationTitle')}</h3>
        </div>
        <p className="mt-1 text-xs text-ink-muted">{t('noLocationHint')}</p>
        <Button size="sm" variant="secondary" className="mt-3" onClick={() => setEditing(true)}>
          {t('setLocation')}
        </Button>
      </Card>
    );
  }

  return (
    <Card elevation={1}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <Input
            list="loc-city-list"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('fieldLocationPlaceholder')}
            autoComplete="off"
            autoFocus
          />
          <datalist id="loc-city-list">
            {CITIES.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
          {input.trim().length >= 2 && (
            <p className={`mt-1 text-xs ${match ? 'text-positive' : 'text-danger'}`}>
              {match ? t('locationMatched', { city: match.name }) : t('locationUnknown')}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" loading={saving} disabled={!match} onClick={save}>
            {t('save')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
