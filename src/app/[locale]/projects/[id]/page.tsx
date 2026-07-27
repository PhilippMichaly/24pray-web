import { notFound } from 'next/navigation';
import { parseLocale } from '@/lib/i18n';
import { fetchPublicProject } from '@/lib/api-server';
import { watchEventJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/patterns/JsonLd';
import WatchClient from './watch-client';

export { generateMetadata } from './metadata';

/**
 * Wachen-Detailseite.
 *
 * Der interaktive Teil (Slot-Grid, Buchung, Tabs) bleibt eine Client-Komponente. Neu ist
 * nur, dass die Wache hier serverseitig geholt und als `initialProject` hineingereicht wird:
 * Client-Komponenten rendern in Next auch auf dem Server, und weil die Daten bisher erst im
 * `useEffect` ankamen, sah ein Crawler eine leere Hülle. Mit der Prop steht Titel, Anliegen,
 * Zeitraum und Fortschritt im ersten HTML — ohne die Seite aufspalten zu müssen.
 *
 * PRIVATE Wachen liefert `fetchPublicProject` bewusst nicht aus. Dann ist `initialProject`
 * null und der Client lädt wie bisher selbst nach (inklusive `?invite=`).
 */
export default async function WatchPage({ params }: { params: { locale: string; id: string } }) {
  const locale = parseLocale(params.locale);
  if (!locale) notFound();

  const project = await fetchPublicProject(params.id);

  return (
    <>
      {project && <JsonLd data={watchEventJsonLd(locale, project)} />}
      <WatchClient id={params.id} initialProject={project} />
    </>
  );
}
