'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, MapPin } from 'lucide-react';
import { GitHubMark } from '@/components/patterns/GitHubMark';
import { api } from '@/lib/api';
import { useFunnelPing } from '@/lib/funnel';
import { Brand } from '@/components/patterns/Brand';
import { UserMenu } from '@/components/patterns/AppShell';
import { LocaleToggle } from '@/components/patterns/LocaleToggle';
import { Globe, type ChainPoint } from '@/components/patterns/Globe';
import { FeedbackDialog, GITHUB_REPO_URL } from '@/components/patterns/FeedbackDialog';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n';
import { useLocale } from '@/lib/locale-context';
import { sectionPath } from '@/lib/routes';

interface PublicStats {
  activeChains: number;
  heldSlots: number;
  completedHours?: number; // optional: tolerant gegen gecachte/alte API-Antworten
  points?: ChainPoint[];
}

export default function LandingClient() {
  useFunnelPing('landing');
  const { locale } = useLocale();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [focusPoint, setFocusPoint] = useState<ChainPoint | null>(null);

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
        {/* Kein Theme-Schalter hier: das Weltall ist immer dunkel, er hätte keine sichtbare Wirkung. */}
        <div className="flex items-center gap-1.5">
          <LocaleToggle />
          <UserMenu />
        </div>
      </header>

      {/* Die Erde und zwei klare Wege. Die Globus-Höhe ist an die Fensterhöhe gekoppelt, damit
          Überschrift und Knöpfe auch am Desktop (1440×900) ohne Scrollen sichtbar bleiben. */}
      <main className="z-10 flex w-full flex-1 flex-col items-center justify-center">
        <div className="relative w-full max-w-[min(52vh,600px)]">
          <Globe
            activeChains={stats?.activeChains ?? 5}
            points={stats?.points}
            focusPoint={focusPoint}
            onSelectPoint={setFocusPoint}
          />
          {focusPoint && (
            <div className="absolute inset-x-0 bottom-2 z-20 mx-auto w-fit max-w-[92%] rounded-lg border border-gold/30 bg-surface/95 px-4 py-3 shadow-3 backdrop-blur">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="shrink-0 text-accent-strong" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {focusPoint.title ?? t('silentChain')}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {focusPoint.locationName ?? t('silentChainHint')}
                    {(focusPoint.links?.length ?? 0) > 0 && (
                      <> · {t('nIntercessors', { n: focusPoint.links!.length })}</>
                    )}
                  </p>
                </div>
                {focusPoint.id && (
                  <Button asChild size="sm" className="shrink-0">
                    <Link href={`/projects/${focusPoint.id}`}>{t('toChain')}</Link>
                  </Button>
                )}
                <button
                  onClick={() => setFocusPoint(null)}
                  aria-label={t('cancel')}
                  className="shrink-0 rounded-sm p-1 text-ink-muted hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Der Vers als Bildunterschrift der leuchtenden Erde (Design-Entscheidung 2026-07-09):
            der Globus zeigt die Lichter der Welt bei Nacht — Matthäus 5,14 deutet genau dieses Bild. */}
        <p className="mt-2 max-w-[460px] text-center font-display text-xl italic leading-snug text-gold">
          {t('verseLightOfWorld')}
        </p>
        <p className="mt-1.5 text-center text-[11px] uppercase tracking-[0.25em] text-ink-muted">
          {t('verseLightOfWorldSource')}
        </p>

        <h1 className="mt-5 max-w-[560px] text-center font-display text-2xl font-semibold leading-tight tracking-tight">
          {t('heroTitle')}
        </h1>

        {/* Zwei direkte Wege statt Auswahl-Sheet (UX-Runde 2026-10-13): Mitbeten ist der häufigste
            Weg und braucht kein Konto — deshalb der Hauptknopf; Anmelden sitzt in der Kopfzeile. */}
        <div className="mt-6 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-2xl sm:flex-row sm:justify-center">
          <Link
            href={sectionPath('watches', locale)}
            className="whitespace-nowrap rounded-full bg-accent px-8 py-3.5 text-center font-display text-lg font-semibold text-accent-ink shadow-3 transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
          >
            {t('heroCtaTake')}
          </Link>
          <Link
            href="/projects/new"
            className="whitespace-nowrap rounded-full border border-gold/40 px-8 py-3.5 text-center font-display text-lg font-semibold text-ink transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
          >
            {t('heroCtaStart')}
          </Link>
        </div>

        {/* Zahlen-Zeile bewusst AUSGEBLENDET (User-Entscheidung 2026-07-09): solange real
            noch nicht gebetet wurde, ist jede Zahl — auch die alte „N Stunden gehalten" —
            unwahr (COMPLETED = Zeitablauf, nicht belegtes Gebet). Reaktivierung, wenn echte
            Gebetsstunden auflaufen: <LandingStats completedHours={stats.completedHours ?? 0}
            activeChains={stats.activeChains} /> — Komponente + Tests liegen bereit. */}
      </main>

      <footer className="z-10 pb-4 pt-4 text-center text-xs text-ink-muted opacity-70">
        24pray · {t('earthCredit')}
        <span className="mx-2">·</span>
        <FeedbackDialog />
        <span className="mx-2">·</span>
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer"
           aria-label={t('githubRepoLabel')} title={t('githubRepoLabel')}
           className="inline-flex align-middle text-ink-muted hover:text-ink">
          <GitHubMark size={14} />
        </a>
        <span className="mx-2">·</span>
        <Link href="/impressum" className="underline underline-offset-2 hover:text-ink">{t('legalImprint')}</Link>
        <span className="mx-2">·</span>
        <Link href="/datenschutz" className="underline underline-offset-2 hover:text-ink">{t('legalPrivacy')}</Link>
      </footer>

    </div>
  );
}
