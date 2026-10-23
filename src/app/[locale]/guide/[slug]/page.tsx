import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/patterns/AppShell';
import { notFound } from 'next/navigation';
import { intlLocaleFor, parseLocale } from '@/lib/i18n';
import { alternatesFor, guidePath, sectionPath } from '@/lib/routes';
import { breadcrumbJsonLd, guideArticleJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/patterns/JsonLd';
import { findGuide, GUIDE_LOCALES, GUIDE_UI, GUIDES, isGuideLocale, type GuideLocale } from '@/content/guides';

type RouteParams = { locale: string; slug: string };
type Params = { params: Promise<RouteParams> };

function resolve(params: RouteParams) {
  const locale = parseLocale(params.locale);
  if (!locale || !isGuideLocale(locale)) return null;
  const guide = findGuide(locale, params.slug);
  return guide ? { locale, guide } : null;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const found = resolve(params);
  if (!found) return {};
  const { locale, guide } = found;
  const text = guide.text[locale];
  const alternates = alternatesFor(locale, (l: GuideLocale) => guidePath(l, guide.text[l].slug), GUIDE_LOCALES);
  return {
    title: text.title,
    description: text.description,
    alternates,
    openGraph: {
      title: text.title,
      description: text.description,
      url: alternates.canonical,
      siteName: '24pray',
      type: 'article',
      modifiedTime: guide.updated,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: text.title }],
    },
  };
}

/**
 * Ein Ratgeber-Artikel. Die Texte liegen in src/content/guides.ts; die Seite ist rein
 * serverseitig, damit der komplette Artikel im ersten HTML steht.
 */
export default async function GuidePage(props: Params) {
  const params = await props.params;
  const found = resolve(params);
  if (!found) notFound();
  const { locale, guide } = found;
  const text = guide.text[locale];
  const ui = GUIDE_UI[locale];
  const others = GUIDES.filter((g) => g.id !== guide.id);
  const updated = new Intl.DateTimeFormat(intlLocaleFor(locale), { dateStyle: 'long' }).format(
    new Date(`${guide.updated}T12:00:00Z`),
  );

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl">
      <JsonLd data={guideArticleJsonLd(locale, guide)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: '24pray', path: `/${locale}` },
          { name: ui.backToGuides, path: sectionPath('guide', locale) },
          { name: text.title, path: guidePath(locale, text.slug) },
        ])}
      />

      <nav className="text-xs text-ink-muted">
        <Link href={sectionPath('guide', locale)} className="underline underline-offset-4 hover:text-ink">
          ← {ui.backToGuides}
        </Link>
      </nav>

      <article className="mt-4">
        <h1 className="font-display text-2xl font-semibold leading-tight text-ink">{text.title}</h1>
        <p className="mt-2 text-xs text-ink-muted">
          {ui.updated}: <time dateTime={guide.updated}>{updated}</time>
        </p>
        <p className="mt-5 text-base leading-relaxed text-ink">{text.intro}</p>

        {text.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="font-display text-lg font-semibold text-ink">{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-ink-muted">
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm leading-relaxed text-ink-muted">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>

      <aside className="mt-12 rounded-md border border-gold/40 bg-gold/5 px-5 py-5">
        <h2 className="font-display text-lg font-semibold text-ink">{ui.ctaHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{ui.ctaBody}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/projects/new"
            className="rounded-full bg-accent px-6 py-2.5 font-display text-sm font-semibold text-accent-ink shadow-3"
          >
            {ui.ctaButton}
          </Link>
          <Link href={sectionPath('watches', locale)} className="text-sm font-medium text-gold underline underline-offset-4">
            {ui.watchesLink} →
          </Link>
        </div>
      </aside>

      {others.length > 0 && (
        <nav className="mt-12">
          <h2 className="font-display text-base font-semibold text-ink">{ui.moreGuides}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {others.map((g) => (
              <li key={g.id}>
                <Link href={guidePath(locale, g.text[locale].slug)} className="text-gold underline underline-offset-4">
                  {g.text[locale].title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      </div>
    </AppShell>
  );
}
