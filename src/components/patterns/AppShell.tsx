'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { LocaleToggle } from './LocaleToggle';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/use-auth';
import { logout } from '@/lib/auth';
import { t } from '@/lib/i18n';

function UserMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();
  if (loading) return <div className="h-9 w-9" />;

  if (!user) {
    return (
      <Button asChild size="sm" variant="ghost">
        <Link href="/auth/login">{t('login')}</Link>
      </Button>
    );
  }

  async function onLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar name={user.name} size="sm" />
      <button
        onClick={onLogout}
        aria-label={t('logout')}
        title={t('logout')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <Brand size="sm" />
          </Link>
          <div className="flex items-center gap-1.5">
            <LocaleToggle />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-ink-muted">
          24pray · {t('tagline')}
          <span className="mx-2">·</span>
          <Link href="/impressum" className="underline underline-offset-2 hover:text-ink">{t('legalImprint')}</Link>
          <span className="mx-2">·</span>
          <Link href="/datenschutz" className="underline underline-offset-2 hover:text-ink">{t('legalPrivacy')}</Link>
        </div>
      </footer>
    </div>
  );
}
