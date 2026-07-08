'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

/** Eigenname je Sprache (kein Übersetzungs-Katalog nötig — Sprachnamen bleiben in sich selbst). */
const NATIVE_NAME: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  he: 'עברית',
  ar: 'العربية',
};
const LOCALES: readonly Locale[] = ['de', 'en', 'es', 'he', 'ar'];

/** Sprachmenü (5 Sprachen inkl. RTL) — Globe-Icon-Button → Dropdown mit Eigennamen je Sprache. */
export function LocaleToggle() {
  const { locale, switchLocale } = useLocale();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Sprache"
          title={NATIVE_NAME[locale]}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Globe size={18} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[9rem] rounded-md border border-border bg-surface p-1 shadow-2 data-[state=open]:animate-in data-[state=open]:fade-in"
        >
          {LOCALES.map((l) => (
            <DropdownMenu.Item
              key={l}
              onSelect={() => switchLocale(l)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-sm outline-none transition-colors',
                'text-ink hover:bg-surface-sunken focus:bg-surface-sunken',
              )}
            >
              <span dir="auto">{NATIVE_NAME[l]}</span>
              {locale === l && <Check size={14} className="shrink-0 text-accent-strong" aria-hidden />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
