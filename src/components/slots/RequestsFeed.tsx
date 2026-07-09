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
import { toast } from '@/components/ui/toast-store';

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

  // Update-Weitergabe dorthin, wo Gebetsgruppen real kommunizieren (Backlog 1):
  // reine Share-Intents (wa.me / t.me), keine Messenger-APIs, keine Daten an Dritte aus unserer Hand.
  // Signal hat keinen Text-Share-Deep-Link → System-Share-Sheet (navigator.share) mit Clipboard-Fallback.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://24pray.org';
  const watchUrl = `${origin}/projects/${projectId}${invite ? `?invite=${encodeURIComponent(invite)}` : ''}`;
  const waHref = (text: string) => `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${watchUrl}`)}`;
  const tgHref = (text: string) =>
    `https://t.me/share/url?url=${encodeURIComponent(watchUrl)}&text=${encodeURIComponent(text)}`;

  async function shareViaSystem(text: string) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text, url: watchUrl });
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return; // Nutzer bricht Share-Sheet ab — still schlucken
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n\n${watchUrl}`);
      toast({ message: t('linkCopiedToast'), variant: 'positive' });
    } catch {
      toast({ message: `${t('shareCopyFailed')} ${watchUrl}` });
    }
  }

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
                <a href={waHref(r.text)} target="_blank" rel="noopener noreferrer"
                   className="underline underline-offset-2 hover:text-ink">
                  {t('shareUpdateWhatsapp')}
                </a>
                <a href={tgHref(r.text)} target="_blank" rel="noopener noreferrer"
                   className="underline underline-offset-2 hover:text-ink">
                  {t('shareUpdateTelegram')}
                </a>
                <button type="button" onClick={() => shareViaSystem(r.text)}
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
