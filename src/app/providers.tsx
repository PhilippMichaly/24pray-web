'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/Toast';
import { LocaleProvider } from '@/lib/locale-context';
import type { Locale } from '@/lib/i18n';

export function Providers({
  children,
  locale,
  prefixed,
}: {
  children: React.ReactNode;
  locale: Locale;
  prefixed: boolean;
}) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LocaleProvider initialLocale={locale} prefixed={prefixed}>
        {children}
        <Toaster />
      </LocaleProvider>
    </ThemeProvider>
  );
}
