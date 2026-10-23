'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CenterShell } from '@/components/patterns/CenterShell';
import { t } from '@/lib/i18n';

function VerifyLoading() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Spinner size={40} className="text-accent" />
      <p className="text-ink-muted">{t('verifying')}</p>
    </div>
  );
}

function VerifyInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // Token einmalig übernehmen: danach verschwindet er aus der URL (und aus useSearchParams).
  const [token] = useState(() => searchParams.get('token'));
  const [status, setStatus] = useState<'ready' | 'submitting' | 'success' | 'error'>(
    token ? 'ready' : 'error',
  );

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  function redeem() {
    if (!token || status !== 'ready') return;
    setStatus('submitting');
    api
      .post('/auth/verify', { token })
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 1200);
      })
      .catch(() => setStatus('error'));
  }

  if (status === 'submitting') return <VerifyLoading />;

  if (status === 'ready') {
    return (
      <Card elevation={2} className="w-full max-w-[380px] text-center">
        {!authLoading && user && (
          <p className="mb-4 text-sm text-ink-muted">{t('verifyAlreadySignedIn', { email: user.email })}</p>
        )}
        <Button onClick={redeem}>{t('verifyConfirm')}</Button>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card elevation={2} className="w-full max-w-[380px] text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-positive/15 text-positive">
          <CheckCircle2 size={26} />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink">{t('loggedIn')}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t('redirecting')}</p>
      </Card>
    );
  }

  return (
    <Card elevation={2} className="w-full max-w-[380px] text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
        <XCircle size={26} />
      </span>
      <h1 className="font-display text-2xl font-semibold text-ink">{t('linkInvalid')}</h1>
      <p className="mt-2 text-sm text-ink-muted">{t('linkInvalidBody')}</p>
      <Button asChild variant="secondary" className="mt-5">
        <Link href="/auth/login">{t('requestNewLink')}</Link>
      </Button>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <CenterShell>
      <Suspense fallback={<VerifyLoading />}>
        <VerifyInner />
      </Suspense>
    </CenterShell>
  );
}
