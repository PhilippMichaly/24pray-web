'use client';

import { useState } from 'react';
import { MessagesSquare } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectWithStats } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from '@/components/ui/toast-store';
import { t } from '@/lib/i18n';

const FIELDS = [
  { key: 'linkWhatsapp' as const, label: 'WhatsApp', placeholder: 'https://chat.whatsapp.com/…' },
  { key: 'linkTelegram' as const, label: 'Telegram', placeholder: 'https://t.me/…' },
  { key: 'linkSignal' as const, label: 'Signal', placeholder: 'https://signal.group/…' },
];

/** Gruppen-Links nachträglich pflegen (nur Organisator) — Muster wie LocationCard. */
export function GroupLinksCard({
  project,
  onUpdated,
}: {
  project: ProjectWithStats;
  onUpdated: (p: ProjectWithStats) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    linkWhatsapp: project.linkWhatsapp ?? '',
    linkTelegram: project.linkTelegram ?? '',
    linkSignal: project.linkSignal ?? '',
  });

  const anySet = FIELDS.some((f) => project[f.key]);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.patch<ProjectWithStats>(`/projects/${project.id}`, {
        linkWhatsapp: values.linkWhatsapp.trim() || null,
        linkTelegram: values.linkTelegram.trim() || null,
        linkSignal: values.linkSignal.trim() || null,
      });
      onUpdated(updated);
      setEditing(false);
      toast({ message: t('groupLinksSaved'), variant: 'positive' });
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <Card elevation={1} className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <MessagesSquare size={18} className="shrink-0 text-accent-strong" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{t('groupLinksTitle')}</p>
            <p className="truncate text-xs text-ink-muted">
              {anySet
                ? FIELDS.filter((f) => project[f.key]).map((f) => f.label).join(' · ')
                : t('groupLinksHint')}
            </p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          {anySet ? t('edit') : t('groupLinksCardCta')}
        </Button>
      </Card>
    );
  }

  return (
    <Card elevation={1} className="space-y-3">
      <p className="text-sm font-medium text-ink">{t('groupLinksTitle')}</p>
      {FIELDS.map((f) => (
        <div key={f.key}>
          <Label htmlFor={f.key}>{f.label}</Label>
          <Input
            id={f.key}
            type="url"
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
          />
        </div>
      ))}
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
