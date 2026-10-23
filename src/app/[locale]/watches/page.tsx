import type { Metadata } from 'next';
import Link from 'next/link';
import { AppShell } from '@/components/patterns/AppShell';
import { notFound } from 'next/navigation';
import { getFixedT, intlLocaleFor, parseLocale, type Locale } from '@/lib/i18n';
import { alternatesFor, projectPath, sectionPath } from '@/lib/routes';
import { fetchPublicProjects, onlyOpenWatches } from '@/lib/api-server';
import { watchListJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/patterns/JsonLd';
import type { ProjectWithStats } from '@/types';

const watchesPathFor = (l: Locale) => sectionPath('watches', l);

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const locale = parseLocale(params.locale);
  if (!locale) return {};
  const t = getFixedT(locale);
  const alternates = alternatesFor(locale, watchesPathFor);
  return {
    title: t('seoWatchesTitle'),
    description: t('seoWatchesDescription'),
    alternates,
    openGraph: {
      title: t('seoWatchesTitle'),
      description: t('seoWatchesDescription'),
      url: alternates.canonical,
      siteName: '24pray',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: t('seoWatchesTitle') }],
    },
  };
}

function formatRange(project: ProjectWithStats, locale: Locale): string {
  const fmt = new Intl.DateTimeFormat(intlLocaleFor(locale), {
    timeZone: project.timezone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `${fmt.format(new Date(project.startDate))} – ${fmt.format(new Date(project.endDate))}`;
}

/**
 * Öffentliche Übersicht aller PUBLIC-Wachen — die Einstiegsseite für Suchmaschinen.
 *
 * Bewusst eine eigene Route und nicht /dashboard: dort mischen sich öffentlicher Katalog und
 * privates „deine Wachen", und der URL-Name taugt für die Suche nicht. Diese Seite ist rein
 * serverseitig, ohne Interaktion — jede Zeile steht als echter Link im HTML.
 */
export default async function WatchesPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = parseLocale(params.locale);
  if (!locale) notFound();
  const t = getFixedT(locale);
  const projects = onlyOpenWatches(await fetchPublicProjects());

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl">
      <JsonLd data={watchListJsonLd(locale, projects)} />

      <h1 className="font-display text-2xl font-semibold text-ink">{t('watchesHeading')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t('watchesIntro')}</p>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-line px-5 py-6 text-center">
          <p className="text-sm text-ink-muted">{t('watchesEmpty')}</p>
          {/* Leerer Katalog ist kein Ende: der nächste Schritt ist, selbst eine zu starten. */}
          <Link
            href="/projects/new"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-display text-sm font-semibold text-accent-ink shadow-3"
          >
            {t('heroCtaStart')}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={projectPath(locale, p.id)}
                className="block rounded-md border border-line px-4 py-3 transition-colors hover:border-gold/50"
              >
                <h2 className="font-display text-base font-semibold text-ink">{p.title}</h2>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{p.description}</p>
                )}
                <p className="mt-2 text-xs text-ink-muted">
                  <span>{formatRange(p, locale)}</span>
                  {p.locationName && <span> · {p.locationName}</span>}
                  <span>
                    {' · '}
                    {t(p.slotDurationMinutes === 1440 ? 'heldOfDays' : 'slotsBookedOf', {
                      booked: p.bookedSlots,
                      total: p.totalSlots,
                    })}
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm">
        <Link href={`/${locale}`} className="text-ink-muted underline underline-offset-4">
          ← 24pray
        </Link>
      </p>
      </div>
    </AppShell>
  );
}
