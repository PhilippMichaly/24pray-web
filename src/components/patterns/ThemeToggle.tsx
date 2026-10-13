'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, MonitorSmartphone } from 'lucide-react';
import { t } from '@/lib/i18n';

const order = ['system', 'light', 'dark'] as const;
const icon = { system: MonitorSmartphone, light: Sun, dark: Moon };

/** `withLabel`: als beschrifteter Textschalter (Fußzeile) statt als nacktes Symbol in der Kopfzeile —
 *  das Bildschirm-Symbol für „System" war ohne Beschriftung nicht zu deuten. */
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Vor Mount kein theme bekannt → neutralen Platzhalter rendern (kein Hydration-Mismatch).
  const current = (mounted ? theme : 'system') as keyof typeof icon;
  const Icon = icon[current] ?? MonitorSmartphone;
  // Im Render statt auf Modulebene: dort würde t() einmalig in der Startsprache ausgewertet.
  const label = { system: t('themeSystem'), light: t('themeLight'), dark: t('themeDark') };

  const cycle = () => {
    const idx = order.indexOf(current as (typeof order)[number]);
    setTheme(order[(idx + 1) % order.length]);
  };

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={cycle}
        aria-label={t('toggleTheme')}
        className="inline-flex items-center gap-1 align-middle underline underline-offset-2 hover:text-ink"
      >
        <Icon size={13} aria-hidden />
        {t('themeLabel')}: {label[current]}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={t('toggleTheme')}
      title={label[current]}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Icon size={18} />
    </button>
  );
}
