import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/patterns/AppShell';
import { notFound } from 'next/navigation';
import { parseLocale } from '@/lib/i18n';
import { alternatesFor, guidePath, sectionPath } from '@/lib/routes';
import { GUIDE_LOCALES, GUIDE_UI, GUIDES, isGuideLocale, type GuideLocale } from '@/content/guides';

const indexPathFor = (l: GuideLocale) => sectionPath('guide', l);

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = parseLocale(params.locale);
  if (!locale || !isGuideLocale(locale)) return {};
  const ui = GUIDE_UI[locale];
  const alternates = alternatesFor(locale, indexPathFor, GUIDE_LOCALES);
  return {
    title: ui.indexTitle,
    description: ui.indexDescription,
    alternates,
    openGraph: {
      title: ui.indexTitle,
      description: ui.indexDescription,
      url: alternates.canonical,
      siteName: '24pray',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: ui.indexTitle }],
    },
  };
}

/** Übersicht der Ratgeber. Rein serverseitig — jeder Artikel steht als echter Link im HTML. */
export default async function GuidesPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = parseLocale(params.locale);
  if (!locale || !isGuideLocale(locale)) notFound();
  const ui = GUIDE_UI[locale];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">{ui.indexTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{ui.indexIntro}</p>

      <ul className="mt-8 space-y-3">
        {GUIDES.map((g) => {
          const text = g.text[locale];
          return (
            <li key={g.id}>
              <Link
                href={guidePath(locale, text.slug)}
                className="block rounded-md border border-line px-4 py-3 transition-colors hover:border-gold/50"
              >
                <h2 className="font-display text-base font-semibold text-ink">{text.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text.description}</p>
                <p className="mt-2 text-xs font-medium text-gold">{ui.readMore} →</p>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link href={sectionPath('watches', locale)} className="font-medium text-gold underline underline-offset-4">
          {ui.watchesLink} →
        </Link>
        <Link href={`/${locale}`} className="text-ink-muted underline underline-offset-4">
          ← 24pray
        </Link>
      </p>
      </div>
    </AppShell>
  );
}
