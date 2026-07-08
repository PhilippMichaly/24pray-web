'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { CenterShell } from '@/components/patterns/CenterShell';
import { Brand } from '@/components/patterns/Brand';
import { t } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLoginUrl, setDevLoginUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Alternative zum Link: 6-stelliger Code aus der Mail (praktisch auf einem anderen Gerät).
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeLoading(true);
    setCodeError('');
    try {
      await api.post('/auth/verify-code', { email, code });
      router.push('/dashboard');
    } catch (err) {
      setCodeError((err as Error).message);
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Testmodus (kein SMTP): API liefert devLoginUrl → direkt einloggbar ohne Postfach.
      const res = await api.post<{ devLoginUrl?: string }>('/auth/magic-link', { email });
      setDevLoginUrl(res?.devLoginUrl ?? null);
      setSent(true);
    } catch {
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <CenterShell>
        <Card elevation={2} className="w-full max-w-[380px] text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-positive/15 text-positive">
            <MailCheck size={26} />
          </span>
          <h1 className="font-display text-2xl font-semibold text-ink">{t('checkEmail')}</h1>
          <p className="mt-2 text-sm text-ink-muted">{t('checkEmailBody', { email })}</p>
          {devLoginUrl && (
            <div className="mt-5 rounded-md border border-accent/30 bg-accent-soft/40 p-3">
              <p className="mb-2 text-xs text-ink-muted">{t('devModeHint')}</p>
              <Button asChild className="w-full">
                <a href={devLoginUrl}>{t('devLoginNow')}</a>
              </Button>
            </div>
          )}

          <form onSubmit={handleCodeSubmit} className="mt-6 border-t border-border pt-5 text-start">
            <Label htmlFor="code">{t('codeLabel')}</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              invalid={!!codeError}
              className="tnum tracking-[0.3em]"
            />
            <p className="mt-1 text-xs text-ink-muted">{t('codeHint')}</p>
            <FieldError>{codeError}</FieldError>
            <Button type="submit" variant="secondary" loading={codeLoading} disabled={code.length !== 6} className="mt-3 w-full">
              {t('codeSubmit')}
            </Button>
          </form>
        </Card>
      </CenterShell>
    );
  }

  return (
    <CenterShell>
      <div className="w-full max-w-[380px]">
        <Brand size="sm" className="mb-6" />
        <Card elevation={2}>
          <h1 className="font-display text-2xl font-semibold text-ink">{t('login')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-6">
            <Label htmlFor="email">{t('emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              invalid={!!error}
              autoComplete="email"
            />
            <FieldError>{error}</FieldError>

            <Button type="submit" loading={loading} disabled={!email} className="mt-4 w-full">
              {loading ? t('sending') : t('sendMagicLink')}
            </Button>

            {/* Art.-9-Einwilligung (besondere Kategorien: religiöse Überzeugung) */}
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              {t('consentLogin')}{' '}
              <Link href="/datenschutz" className="underline underline-offset-2 hover:text-ink">
                {t('privacyPolicy')}
              </Link>
              .
            </p>
          </form>
        </Card>
      </div>
    </CenterShell>
  );
}
