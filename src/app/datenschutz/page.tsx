import type { Metadata } from 'next';
import { AppShell } from '@/components/patterns/AppShell';
import { ANBIETER, ANBIETER_UNVOLLSTAENDIG } from '@/lib/anbieter';

export const metadata: Metadata = { title: 'Datenschutzerklärung — 24pray' };

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-1 mt-6 font-semibold">{children}</h2>;
}

export default function DatenschutzPage() {
  return (
    <AppShell>
      <article className="space-y-3 text-sm leading-relaxed text-ink">
        <h1 className="font-display text-2xl font-semibold">Datenschutzerklärung</h1>
        <p className="text-ink-muted">Stand: Juli 2026</p>

        {ANBIETER_UNVOLLSTAENDIG && (
          <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-danger">
            Hinweis: Die Angaben zum Verantwortlichen sind noch nicht vollständig hinterlegt.
          </p>
        )}

        <H2>1. Verantwortlicher</H2>
        <p>
          {ANBIETER.name}, {ANBIETER.strasse}, {ANBIETER.ort}, {ANBIETER.land}.
          E-Mail: {ANBIETER.email}. Anfragen zum Datenschutz (Auskunft, Löschung usw.)
          bitte an diese Adresse.
        </p>

        <H2>2. Das Wichtigste in Kürze</H2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kein Tracking, keine Analyse-Tools, keine Werbung, keine Weitergabe zu kommerziellen Zwecken.</li>
          <li>Nur ein technisch notwendiges Session-Cookie — deshalb auch kein Cookie-Banner.</li>
          <li>Alle Schriften, Bilder und Karten liegen auf unserem eigenen Server; beim Seitenaufruf werden keine Dritt-Dienste eingebunden.</li>
          <li>Ortsangaben sind freiwillig und erscheinen öffentlich nur als anonymer Lichtpunkt auf der Weltkugel.</li>
        </ul>

        <H2>3. Hosting und Server-Logs</H2>
        <p>
          24pray läuft auf einem Server der Strato AG (Berlin), mit der ein
          Auftragsverarbeitungsvertrag nach Art.&nbsp;28 DSGVO besteht. Beim Aufruf der Seite
          verarbeitet der Webserver technisch bedingt Verbindungsdaten (IP-Adresse, Zeitpunkt,
          aufgerufene Ressource) in Protokolldateien. Rechtsgrundlage ist unser berechtigtes
          Interesse an einem sicheren, stabilen Betrieb (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO);
          die Protokolle werden turnusmäßig gelöscht.
        </p>

        <H2>4. Konto und Anmeldung (Magic-Link / Code)</H2>
        <p>
          Für ein Konto speichern wir deine E-Mail-Adresse und einen Anzeigenamen. Die Anmeldung
          erfolgt ohne Passwort über einen einmaligen Link bzw. 6-stelligen Code per E-Mail
          (15&nbsp;Minuten gültig). Nach der Anmeldung setzt 24pray ein technisch notwendiges
          Session-Cookie (HttpOnly, 30&nbsp;Tage) — Rechtsgrundlage §&nbsp;25 Abs.&nbsp;2 Nr.&nbsp;2
          TDDDG bzw. Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO; eine Einwilligung ist dafür nicht
          erforderlich, weitere Cookies gibt es nicht.
        </p>

        <H2>5. Gebetswachen, Buchungen und Anliegen — besondere Daten (Art. 9 DSGVO)</H2>
        <p>
          Wer eine Gebetsstunde übernimmt oder ein Anliegen teilt, gibt damit zu erkennen, sich
          für Gebet zu interessieren — daraus kann auf eine religiöse Überzeugung geschlossen
          werden. Solche Daten sind durch Art.&nbsp;9 DSGVO besonders geschützt. Wir verarbeiten
          sie ausschließlich auf Grundlage deiner ausdrücklichen Einwilligung
          (Art.&nbsp;9 Abs.&nbsp;2 lit.&nbsp;a DSGVO), die du bei der Anmeldung bzw. Buchung
          erteilst und jederzeit mit Wirkung für die Zukunft widerrufen kannst — am einfachsten,
          indem du deine Buchung stornierst oder uns per E-Mail um Löschung bittest.
        </p>
        <p>
          Gespeichert werden: gebuchte Zeitfenster, bei Gastbuchungen der angegebene Name und
          optional die E-Mail-Adresse (nur für Bestätigungs- und Erinnerungsmail), Gebetsanliegen
          sowie freiwillige, grobe Ortsangaben (Stadt-Koordinaten).
        </p>

        <H2>6. Sichtbarkeit von Namen</H2>
        <p>
          In einer Gebetswache ist der eingetragene Name für andere Betrachter der Gebetswache sichtbar —
          bei öffentlichen Gebetswachen für alle, bei privaten nur für Personen mit Einladungslink.
          Organisatorinnen und Organisatoren können beim Anlegen einer Gebetswache die Maskierung
          aktivieren ({'„Namen für Außenstehende maskieren“'}); dann sehen nicht angemeldete Besucher
          nur eine Kurzform (z.&nbsp;B. {'„Ruth K.“'}). Auf der Weltkugel der Startseite erscheinen
          niemals Namen, sondern nur anonyme Koordinaten-Punkte.
        </p>

        <H2>7. E-Mails</H2>
        <p>
          Wir versenden ausschließlich funktionale E-Mails (Anmelde-Link/-Code,
          Buchungsbestätigung, Erinnerung an deine Gebetsstunde) über den Mail-Server von Strato
          (Absender no-reply@24pray.org). Keine Newsletter, keine Werbung. Die
          Erinnerungs-Vorlaufzeit kannst du in der Buchung selbst ändern.
        </p>

        <H2>8. Kalender-Links</H2>
        <p>
          Bestätigungs- und Erinnerungsmails enthalten Links, mit denen du deine Stunde in deinen
          Kalender übernehmen kannst (.ics-Datei von unserem Server sowie ein Link zu Google
          Kalender). Der Google-Link wird erst aktiv, wenn du ihn anklickst — dann gelten die
          Datenschutzbestimmungen von Google.
        </p>

        <H2>9. Speicherdauer</H2>
        <p>
          Konten und Wachendaten speichern wir, bis du sie löschst oder ihre Löschung verlangst.
          Anmelde-Tokens verfallen nach 15&nbsp;Minuten, Sessions nach 30&nbsp;Tagen. Tägliche
          technische Sicherungskopien werden nach 14&nbsp;Tagen überschrieben.
        </p>

        <H2>10. Deine Rechte</H2>
        <p>
          Du hast das Recht auf Auskunft (Art.&nbsp;15), Berichtigung (Art.&nbsp;16), Löschung
          (Art.&nbsp;17), Einschränkung der Verarbeitung (Art.&nbsp;18), Datenübertragbarkeit
          (Art.&nbsp;20) und Widerspruch (Art.&nbsp;21 DSGVO) sowie das Recht, erteilte
          Einwilligungen jederzeit zu widerrufen. Wende dich dafür formlos an die oben genannte
          E-Mail-Adresse. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde
          beschweren.
        </p>
      </article>
    </AppShell>
  );
}
