'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, MonitorSmartphone } from 'lucide-react';
import { t } from '@/lib/i18n';

const order = ['system', 'light', 'dark'] as const;
const icon = { system: MonitorSmartphone, light: Sun, dark: Moon };
const label = { system: t('themeSystem'), light: t('themeLight'), dark: t('themeDark') };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Vor Mount kein theme bekannt → neutralen Platzhalter rendern (kein Hydration-Mismatch).
  const current = (mounted ? theme : 'system') as keyof typeof icon;
  const Icon = icon[current] ?? MonitorSmartphone;

  return (
    <button
      type="button"
      onClick={() => {
        const idx = order.indexOf(current as (typeof order)[number]);
        setTheme(order[(idx + 1) % order.length]);
      }}
      aria-label={t('toggleTheme')}
      title={label[current]}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Icon size={18} />
    </button>
  );
}
