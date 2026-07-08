'use client';

import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';

/** DE/EN-Umschalter — manuelle Wahl gewinnt dauerhaft über die Browser-Sprache. */
export function LocaleToggle() {
  const { locale, switchLocale } = useLocale();
  return (
    <div className="flex items-center rounded-md border border-border text-xs" role="group" aria-label="Sprache">
      {(['de', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            'px-2 py-1.5 font-medium uppercase transition-colors first:rounded-l-md last:rounded-r-md',
            locale === l ? 'bg-surface-sunken text-ink' : 'text-ink-muted hover:text-ink',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
