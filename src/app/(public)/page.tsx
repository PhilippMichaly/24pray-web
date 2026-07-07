'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Brand } from '@/components/patterns/Brand';
import { ThemeToggle } from '@/components/patterns/ThemeToggle';
import { Globe } from '@/components/patterns/Globe';
import { t } from '@/lib/i18n';

interface PublicStats {
  activeChains: number;
  heldSlots: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    api
      .get<PublicStats>('/stats/public')
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    // Der Hero spielt im Weltall → bewusst immer Nachtwache-Tokens (data-theme).
    <div data-theme="dark" className="relative flex min-h-screen flex-col items-center overflow-hidden bg-bg px-6 text-ink">
      <header className="z-10 flex w-full max-w-5xl items-center justify-between py-5">
        <Brand size="sm" />
        <ThemeToggle />
      </header>

      <main className="z-10 flex w-full max-w-xl flex-1 flex-col items-center justify-center text-center">
        <div className="relative w-full max-w-[420px]">
          <Globe activeChains={stats?.activeChains ?? 5} />
        </div>

        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">
          {t('heroTitle')}
        </h1>
        <p className="mt-3 max-w-[340px] text-base leading-relaxed text-ink-muted">
          {t('heroSubtitle')}
        </p>

        {stats && stats.activeChains > 0 && (
          <p className="mt-4 text-sm text-gold tnum" aria-live="polite">
            {t('statsChainsActive', { n: stats.activeChains })}
            {stats.heldSlots > 0 && <> · {t('statsHoursHeld', { n: stats.heldSlots })}</>}
          </p>
        )}

        <div className="mt-8 flex w-full max-w-[320px] flex-col gap-3">
          <Button asChild size="lg">
            <Link href="/auth/login">{t('login')}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/dashboard">{t('exploreProjects')}</Link>
          </Button>
        </div>

        <Badge variant="accent" className="mt-7">
          {t('noAccountNeeded')}
        </Badge>
      </main>

      <footer className="z-10 pb-6 pt-8 text-xs text-ink-muted">
        24pray · {t('tagline')}
      </footer>
    </div>
  );
}
