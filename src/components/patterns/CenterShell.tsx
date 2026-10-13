'use client';

import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from './ThemeToggle';

// Zentrierte Bühne für Pre-Auth-Screens (Login/Verify/Join).
// Sprache und Darstellung bleiben oben rechts erreichbar (Akzeptanzkriterium Welle 1) —
// die Sprache zuerst: wer per Mail-Link hier landet, liest die Seite womöglich in der falschen.
export function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="absolute end-4 top-4 flex items-center gap-1.5">
        <LocaleToggle />
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
