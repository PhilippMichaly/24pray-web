'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, HeartHandshake, PlusCircle, type LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Sheet } from '@/components/ui/Sheet';
import { Brand } from '@/components/patterns/Brand';
import { ThemeToggle } from '@/components/patterns/ThemeToggle';
import { Globe, type ChainPoint } from '@/components/patterns/Globe';
import { t } from '@/lib/i18n';

interface PublicStats {
  activeChains: number;
  heldSlots: number;
  points?: ChainPoint[];
}

function PrayOption({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-md border bg-surface px-4 py-4 text-left transition-colors hover:border-accent hover:bg-accent-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <Icon size={22} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{label}</span>
        <span className="block text-sm text-ink-muted">{desc}</span>
      </span>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [choiceOpen, setChoiceOpen] = useState(false);

  useEffect(() => {
    const load = () =>
      api
        .get<PublicStats>('/stats/public')
        .then(setStats)
        .catch(() => setStats(null));
    load();
    const id = setInterval(load, 60_000); // Punkte/Zahlen bleiben frisch
    return () => clearInterval(id);
  }, []);

  return (
    // Weltall = immer Nachtwache-Tokens (data-theme), Rest der App bleibt theme-frei.
    <div data-theme="dark" className="relative flex min-h-screen flex-col items-center overflow-hidden bg-bg px-4 text-ink">
      <header className="z-10 flex w-full max-w-5xl items-center justify-between py-4">
        <Brand size="sm" />
        <ThemeToggle />
      </header>

      {/* Nur die Erde, groß — und ein Button. */}
      <main className="z-10 flex w-full flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-[min(78vh,700px)]">
          <Globe activeChains={stats?.activeChains ?? 5} points={stats?.points} />
        </div>

        <h1 className="-mt-2 max-w-[560px] text-center font-display text-2xl font-semibold leading-tight tracking-tight">
          {t('heroTitle')}
        </h1>

        <button
          onClick={() => setChoiceOpen(true)}
          className="mt-6 rounded-full bg-accent px-14 py-4 font-display text-2xl font-semibold text-accent-ink shadow-3 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
        >
          {t('prayCta')}
        </button>

        {stats && stats.activeChains > 0 && (
          <p className="mt-5 text-sm text-gold tnum" aria-live="polite">
            {t('statsChainsActive', { n: stats.activeChains })}
            {stats.heldSlots > 0 && <> · {t('statsHoursHeld', { n: stats.heldSlots })}</>}
          </p>
        )}
      </main>

      <footer className="z-10 pb-4 pt-4 text-center text-xs text-ink-muted opacity-70">
        24pray · {t('earthCredit')}
      </footer>

      <Sheet open={choiceOpen} onOpenChange={setChoiceOpen} title={t('prayChoiceTitle')}>
        <div className="space-y-2.5">
          {/* Zielorientierte Reihenfolge: erst beten (ohne Hürde), dann starten, dann anmelden */}
          <PrayOption
            icon={HeartHandshake}
            label={t('optBrowse')}
            desc={t('optBrowseDesc')}
            onClick={() => router.push('/dashboard')}
          />
          <PrayOption
            icon={PlusCircle}
            label={t('optCreate')}
            desc={t('optCreateDesc')}
            onClick={() => router.push('/projects/new')}
          />
          <PrayOption
            icon={LogIn}
            label={t('optLogin')}
            desc={t('optLoginDesc')}
            onClick={() => router.push('/auth/login')}
          />
        </div>
      </Sheet>
    </div>
  );
}
