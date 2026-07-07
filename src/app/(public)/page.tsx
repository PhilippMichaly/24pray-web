import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Brand } from '@/components/patterns/Brand';
import { CenterShell } from '@/components/patterns/CenterShell';
import { t } from '@/lib/i18n';

export default function HomePage() {
  return (
    <CenterShell>
      <div className="flex w-full max-w-[340px] flex-col items-center text-center">
        <Brand size="lg" monogramOnly className="mb-6" />

        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          {t('appName')}
        </h1>
        <p className="mt-3 max-w-[300px] text-base leading-relaxed text-ink-muted">
          {t('tagline')}
        </p>

        <div className="mt-10 flex w-full flex-col gap-3">
          <Button asChild size="lg">
            <Link href="/auth/login">{t('login')}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/dashboard">{t('exploreProjects')}</Link>
          </Button>
        </div>

        <Badge variant="accent" className="mt-8">
          {t('noAccountNeeded')}
        </Badge>
      </div>
    </CenterShell>
  );
}
