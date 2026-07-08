'use client';

import { useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectWithStats } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { toast } from '@/components/ui/toast-store';
import { t } from '@/lib/i18n';

const PREVIEW_LEN = 140;

/** Anliegen/Beschreibung nachträglich pflegen (nur Organisator) — Muster wie GroupLinksCard/LocationCard (Punkt 9). */
export function ConcernCard({
  project,
  onUpdated,
}: {
  project: ProjectWithStats;
  onUpdated: (p: ProjectWithStats) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(project.description ?? '');

  async function save() {
    setSaving(true);
    try {
      const trimmed = value.trim();
      const updated = await api.patch<ProjectWithStats>(`/projects/${project.id}`, {
        description: trimmed || null,
      });
      onUpdated(updated);
      setEditing(false);
      toast({ message: t('concernSaved'), variant: 'positive' });
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    const description = project.description;
    const preview = description
      ? description.length > PREVIEW_LEN ? `${description.slice(0, PREVIEW_LEN)}…` : description
      : null;
    return (
      <Card elevation={1} className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <NotebookPen size={18} className="shrink-0 text-accent-strong" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{t('concernCardTitle')}</p>
            <p className="truncate text-xs text-ink-muted">{preview ?? t('concernCardHint')}</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          {description ? t('edit') : t('concernCardCta')}
        </Button>
      </Card>
    );
  }

  return (
    <Card elevation={1} className="space-y-3">
      <p className="text-sm font-medium text-ink">{t('concernCardTitle')}</p>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder={t('concernCardHint')}
      />
      <div className="flex gap-2">
        <Button size="sm" loading={saving} onClick={save}>
          {t('save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          {t('cancel')}
        </Button>
      </div>
    </Card>
  );
}
