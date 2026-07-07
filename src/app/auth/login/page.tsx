'use client';

import { useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/magic-link', { email });
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
          </form>
        </Card>
      </div>
    </CenterShell>
  );
}
