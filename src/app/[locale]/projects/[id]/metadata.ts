import type { Metadata } from 'next';
import { getFixedT, parseLocale, type Locale } from '@/lib/i18n';
import { alternatesFor, projectPath } from '@/lib/routes';
import { fetchPublicProject } from '@/lib/api-server';

const DESCRIPTION_MAX_LEN = 160;

function truncate(text: string, max = DESCRIPTION_MAX_LEN): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Meta-Daten pro Wache: Suchergebnis-Titel, Beschreibung, Canonical + hreflang und die
 * OpenGraph-Vorschau für geteilte Links.
 *
 * PRIVATE Wachen bekommen bewusst nur den generischen Site-Titel UND `noindex`: ihr Inhalt
 * darf weder in Meta-Tags noch in den Index geraten. Sie sind nur über den Einladungslink
 * erreichbar — genau so steht es auch in der FAQ auf der Landing.
 */
export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const locale = parseLocale(params.locale) ?? ('de' as Locale);
  const t = getFixedT(locale);
  const project = await fetchPublicProject(params.id);

  if (!project) {
    return {
      title: t('seoSiteTitle'),
      description: t('seoSiteDescription'),
      robots: { index: false, follow: true },
    };
  }

  const title = `${project.title} — 24pray`;
  const description = project.description
    ? truncate(project.description)
    : truncate(
        t(project.slotDurationMinutes === 1440 ? 'heldOfDays' : 'slotsBookedOf', {
          booked: project.bookedSlots,
          total: project.totalSlots,
        }),
      );
  const alternates = alternatesFor(locale, (l) => projectPath(l, project.id));

  // Next merged `openGraph`/`twitter` NICHT tief pro Feld — ein hier gesetztes Objekt ersetzt
  // das des Root-Layouts komplett. og:image daher erneut mitgeben, sonst fehlt es hier.
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: '24pray',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}
