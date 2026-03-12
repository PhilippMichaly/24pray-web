'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
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
      setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <span className="text-3xl">✉️</span>
        </div>
        <h1 className="font-display text-2xl font-bold">{t('checkEmail')}</h1>
        <p className="mt-2 max-w-[300px] text-sm text-[var(--text-muted)]">
          Wir haben dir einen Login-Link an <strong>{email}</strong> geschickt.
          Klicke den Link in der E-Mail um dich einzuloggen.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-[360px]">
        <h1 className="font-display text-2xl font-bold">{t('login')}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Wir senden dir einen Login-Link per E-Mail.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
            E-Mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
            className="w-full rounded-xl border-[1.5px] border-[#E8E4DE] bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-400"
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="mt-4 w-full rounded-xl bg-brand-400 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
          >
            {loading ? 'Wird gesendet...' : 'Magic Link senden'}
          </button>
        </form>
      </div>
    </main>
  );
}
