import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFixedT, parseLocale } from '@/lib/i18n';
import { alternatesFor, landingPath, sectionPath } from '@/lib/routes';
import { FAQ_KEYS, faqJsonLd, siteJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/patterns/JsonLd';
import LandingClient from './landing-client';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = parseLocale(params.locale);
  if (!locale) return {};
  const t = getFixedT(locale);
  return {
    title: t('seoSiteTitle'),
    description: t('seoSiteDescription'),
    alternates: alternatesFor(locale, landingPath),
    openGraph: {
      title: t('seoSiteTitle'),
      description: t('seoSiteDescription'),
      url: alternatesFor(locale, landingPath).canonical,
      siteName: '24pray',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: t('seoSiteTitle') }],
    },
  };
}

/**
 * Landing.
 *
 * Der Globus darüber ist eine Client-Komponente und bleibt es — er lebt von Canvas und
 * Drag. Alles ab hier ist bewusst statischer Server-Text: es ist der einzige Inhalt der
 * Startseite, den eine Suchmaschine lesen und bewerten kann.
 */
export default function LandingPage({ params }: { params: { locale: string } }) {
  const locale = parseLocale(params.locale);
  if (!locale) notFound();
  const t = getFixedT(locale);

  const steps = [
    ['landingStep1Heading', 'landingStep1Body'],
    ['landingStep2Heading', 'landingStep2Body'],
    ['landingStep3Heading', 'landingStep3Body'],
  ] as const;

  return (
    <>
      <JsonLd data={siteJsonLd(locale)} />
      <JsonLd data={faqJsonLd(locale)} />
      <LandingClient />

      <div className="mx-auto w-full max-w-2xl px-5 pb-20 pt-4">
        <section className="border-t border-line pt-10">
          <h2 className="font-display text-xl font-semibold text-ink">{t('landingWhatHeading')}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t('landingWhatBody')}</p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink">{t('landingHowHeading')}</h2>
          <ol className="mt-4 space-y-5">
            {steps.map(([heading, body], i) => (
              <li key={heading} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold tabular-nums text-gold"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{t(heading)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t(body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink">{t('landingFaqHeading')}</h2>
          <dl className="mt-4 space-y-5">
            {FAQ_KEYS.map(([q, a]) => (
              <div key={q}>
                <dt className="text-sm font-semibold text-ink">{t(q)}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{t(a)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Interne Verlinkung: von der Startseite in die Übersicht, die alle Wachen bündelt. */}
        <p className="mt-10 text-sm">
          <Link href={sectionPath('watches', locale)} className="font-medium text-gold underline underline-offset-4">
            {t('watchesHeading')} →
          </Link>
        </p>
      </div>
    </>
  );
}
