'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/Toast';
import { LocaleProvider } from '@/lib/locale-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LocaleProvider>
        {children}
        <Toaster />
      </LocaleProvider>
    </ThemeProvider>
  );
}
