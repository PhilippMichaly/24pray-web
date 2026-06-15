'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

function VerifyInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    api
      .post('/auth/verify', { token })
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 1500);
      })
      .catch(() => {
        setStatus('error');
      });
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {status === 'loading' && (
        <>
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-400" />
          <p className="text-[var(--text-muted)]">Link wird verifiziert...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Eingeloggt!</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Du wirst weitergeleitet...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <span className="text-3xl">✕</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Link ungültig</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Dieser Link ist abgelaufen oder wurde bereits verwendet.
          </p>
        </>
      )}
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-400" />
          <p className="text-[var(--text-muted)]">Link wird verifiziert...</p>
        </main>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
