'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { GitHubMark } from '@/components/patterns/GitHubMark';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';

export const GITHUB_REPO_URL = 'https://github.com/PhilippMichaly/24pray-web';

/** Feedback ohne Anmeldung (User-Zusatzpunkt): Mini-Dialog → Mail an den Betreiber,
 *  kein Drittanbieter-Widget. Erfolgs-Zustand verweist zusätzlich auf GitHub-Issues. */
export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) {
      setError(t('feedbackHint'));
      return;
    }
    setError(null);
    setSending(true);
    try {
      await api.post('/feedback', {
        message: message.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  function onOpenChange(o: boolean) {
    setOpen(o);
    if (!o) {
      setDone(false);
      setMessage('');
      setEmail('');
      setError(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="underline underline-offset-2 hover:text-ink"
      >
        {t('feedbackLink')}
      </button>
      <Sheet open={open} onOpenChange={onOpenChange} title={t('feedbackTitle')}>
        {done ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-ink">{t('feedbackThanks')}</p>
            <a
              href={`${GITHUB_REPO_URL}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-ink-muted underline underline-offset-2 hover:text-ink"
            >
              <GitHubMark size={14} /> {t('feedbackGithub')}
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-ink-muted">{t('feedbackHint')}</p>
            <div>
              <Label htmlFor="fbMessage">{t('feedbackMessageLabel')}</Label>
              <Textarea
                id="fbMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
              />
            </div>
            <div>
              <Label htmlFor="fbEmail">{t('feedbackEmailLabel')}</Label>
              <Input id="fbEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <FieldError>{error}</FieldError>
            <div className="flex items-center justify-between gap-3">
              <a
                href={`${GITHUB_REPO_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-ink-muted underline underline-offset-2 hover:text-ink"
              >
                <GitHubMark size={13} /> {t('feedbackGithub')}
              </a>
              <Button type="submit" loading={sending}>
                {t('feedbackSend')}
              </Button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  );
}
