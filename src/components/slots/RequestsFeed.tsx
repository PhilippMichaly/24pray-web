'use client';

import { useCallback, useEffect, useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { getRequests, postRequest } from '@/lib/api';
import type { PrayerRequestView } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDayHeader } from '@/lib/time';
import { t } from '@/lib/i18n';
import { buildWatchUrl, waShareHref, tgShareHref, shareViaSystem } from '@/lib/share';

export interface RequestsFeedProps {
  projectId: string;
  projectTz: string;
  isLoggedIn: boolean;
  /** Eine Kette = ein Anliegen des Erstellers: nur der Owner postet Updates. */
  isOrganizer?: boolean;
  invite?: string;
}

export function RequestsFeed({ projectId, projectTz, isLoggedIn, isOrganizer, invite }: RequestsFeedProps) {
  const [items, setItems] = useState<PrayerRequestView[] | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    getRequests(projectId, invite)
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [projectId, invite]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 2) return setError(t('errRequestTooShort'));
    setError(null);
    setSending(true);
    try {
      await postRequest(projectId, { text: text.trim() }, invite);
      setText('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  // Update-Weitergabe dorthin, wo Gebetsgruppen real kommunizieren (Backlog 1) — Share-Lib.
  const watchUrl = buildWatchUrl(projectId, invite);

  return (
    <div className="space-y-6">
      {isOrganizer && (
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label htmlFor="reqText">{t('requestLabel')}</Label>
          <Textarea
            id="reqText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={t('requestPlaceholder')}
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" loading={sending}>
          {t('shareRequest')}
        </Button>
      </form>
      )}

      {items === null ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={HeartHandshake} title={t('noRequestsTitle')} description={t('noRequestsHint')} />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-md border bg-surface p-4">
              <div className="flex items-center gap-2">
                <Avatar name={r.authorName} size="sm" />
                <span className="text-sm font-medium text-ink">{r.authorName ?? '—'}</span>
                <span className="ms-auto text-xs text-ink-muted">
                  {formatDayHeader(r.createdAt, projectTz)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{r.text}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-ink-muted">
                <a href={waShareHref(r.text, watchUrl)} target="_blank" rel="noopener noreferrer"
                   className="underline underline-offset-2 hover:text-ink">
                  {t('shareUpdateWhatsapp')}
                </a>
                <a href={tgShareHref(r.text, watchUrl)} target="_blank" rel="noopener noreferrer"
                   className="underline underline-offset-2 hover:text-ink">
                  {t('shareUpdateTelegram')}
                </a>
                <button type="button" onClick={() => shareViaSystem(r.text, watchUrl)}
                        className="underline underline-offset-2 hover:text-ink">
                  {t('shareUpdateOther')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
