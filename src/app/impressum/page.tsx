import type { Metadata } from 'next';
import { AppShell } from '@/components/patterns/AppShell';
import { ANBIETER, ANBIETER_UNVOLLSTAENDIG } from '@/lib/anbieter';

export const metadata: Metadata = { title: 'Impressum — 24pray' };

export default function ImpressumPage() {
  return (
    <AppShell>
      <article className="prose-legal space-y-5 text-sm leading-relaxed text-ink">
        <h1 className="font-display text-2xl font-semibold">Impressum</h1>

        {ANBIETER_UNVOLLSTAENDIG && (
          <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-danger">
            Hinweis: Die Anbieterangaben sind noch nicht vollständig hinterlegt.
          </p>
        )}

        <section>
          <h2 className="mb-1 font-semibold">Angaben gemäß § 5 DDG</h2>
          <p>
            {ANBIETER.name}
            <br />
            {ANBIETER.strasse}
            <br />
            {ANBIETER.ort}
            <br />
            {ANBIETER.land}
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Kontakt</h2>
          <p>E-Mail: {ANBIETER.email}</p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Verantwortlich für den Inhalt</h2>
          <p>
            {ANBIETER.name} (Anschrift wie oben)
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Haftung für Inhalte</h2>
          <p>
            24pray ist eine nichtkommerzielle Plattform zur Organisation von Gebetswachen.
            Für von Nutzerinnen und Nutzern eingestellte Inhalte (z.&nbsp;B. Wachentitel,
            Gebetsanliegen) sind die jeweiligen Verfasser verantwortlich. Rechtswidrige
            Inhalte entfernen wir nach Kenntnisnahme unverzüglich — bitte per E-Mail an die
            oben genannte Adresse melden.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Streitbeilegung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor
            einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </article>
    </AppShell>
  );
}
