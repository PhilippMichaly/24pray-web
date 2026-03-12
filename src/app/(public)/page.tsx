import Link from 'next/link';
import { t } from '@/lib/i18n';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-500 shadow-lg shadow-brand-400/30">
        <span className="text-3xl">🙏</span>
      </div>

      {/* Title */}
      <h1 className="font-display text-4xl font-bold tracking-tight">
        {t('appName')}
      </h1>
      <p className="mt-3 max-w-[300px] text-base leading-relaxed text-[var(--text-muted)]">
        {t('tagline')}
      </p>

      {/* CTAs */}
      <div className="mt-10 flex w-full max-w-[320px] flex-col gap-3">
        <Link
          href="/auth/login"
          className="flex items-center justify-center rounded-xl bg-brand-400 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-500 active:scale-[0.97]"
        >
          {t('login')}
        </Link>
        <Link
          href="/projects"
          className="flex items-center justify-center rounded-xl bg-[#F2F0EB] px-6 py-3.5 text-[15px] font-semibold text-[var(--text)] transition-colors hover:bg-[#E8E4DE] active:scale-[0.97]"
        >
          {t('exploreProjects')}
        </Link>
      </div>

      <p className="mt-8 text-xs text-[var(--text-muted)]">
        Kein Account nötig zum Mitmachen
      </p>
    </main>
  );
}
