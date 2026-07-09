# 24pray — Backlog (priorisiert)

Stand 2026-07-09. Quelle: Web2-Experten-Review (Session 08./09.07.) + gesammelte Merkposten.
Arbeitsmodus für die Umsetzungs-Session: Skill `24pray-ops` laden, Sonnet-Worker + Advisor-Muster.

## Paket „Web2-Loops" (Review-Erkenntnisse, in dieser Reihenfolge)

1. ~~**Update-Benachrichtigung an Beter**~~ — GEBAUT 2026-07-09 (lokalisierte Mail in 5 Sprachen
   an alle Teilnehmer, HMAC-Abmelde-Link, Share pro Update (WhatsApp/Telegram/Signal-System-Share);
   Empfänger-Locale wird seitdem bei Login/Buchung erfasst). DEPLOYED 2026-07-09
   (UNSUBSCRIBE_SECRET gesetzt, Migration auf Prod applied). Mail-i18n der ALT-Mails =
   Merkposten unten.
2. **Kumulative Zahlen + Schwellwert** — GEBAUT, aber AUSGEBLENDET (User-Entscheidung
   2026-07-09): Solange real noch nicht gebetet wurde, ist jede Zahl unwahr — COMPLETED-Slots
   entstehen durch Zeitablauf gebuchter Stunden, nicht durch belegtes Gebet. Die Landing zeigt
   deshalb GAR KEINE Zahlen mehr (auch die alte, falsch beschriftete „N Stunden gehalten"-Zeile
   ist raus). Code liegt fertig bereit: API `completedHours` in `/stats/public` (live),
   Komponente `LandingStats` (Schwelle 5) + Tests. Reaktivierung = eine Zeile in
   `src/app/(public)/page.tsx` (siehe Kommentar dort). Vorher klären: Was zählt als „gebetet"?
   (Bestätigungs-Geste nach der Stunde statt bloßem Zeitablauf?)
3. **Über-uns-/Werte-Seite** — wer steht dahinter, Glaubensbasis, warum kostenlos/werbefrei,
   Datensparsamkeit als Haltung. Vertrauensfundament im Gebets-Kontext. Reiner Text + Footer-Link.
4. ~~**Einladungs-Moment nach Buchung**~~ — GEBAUT 2026-07-09 (Gast-Erfolgs-Screen: „Lade
   jemanden ein, die Stunde neben dir zu übernehmen" + Share-Trio WhatsApp/Telegram/Signal-
   System-Share; Bestätigungsmail: Einladungs-Absatz mit Wachen-Link, PRIVATE mit ?invite=.
   Share-Logik in gemeinsame Lib src/lib/share.ts extrahiert, RequestsFeed nutzt sie mit.)
5. ~~**Listen-Filter im Dashboard**~~ — GEBAUT 2026-07-09 (Wache bekommt language-Feld beim
   Anlegen, still aus der UI-Sprache wie die Zeitzone; Sprach-Filter über der Liste, native
   Sprachnamen. Sortierung bewusst NICHT geändert — bleibt neueste zuerst, User-Entscheidung.
   Kategorien = spätere Ausbaustufe.)
6. ~~**Konto-Nutzen sichtbar machen**~~ — GEBAUT 2026-07-09 (AccountBenefits-Komponente:
   drei Punkte „alle Stunden / Erinnerungen / Name gemerkt"; im Gast-Erfolgs-Screen kompakt
   unter dem Einladungs-Block, auf der Login-Seite zwischen Subtitle und Formular. Kein Zwang,
   nur Sichtbarkeit.)
7. ~~**Web-Push (PWA)**~~ — GEBAUT 2026-07-09 (Opt-in pro Gerät auf der Profil-Seite, nur für
   Konten; Stunden-Erinnerung + Owner-Updates als Zweitkanal neben Mail; self-hosted VAPID,
   kein Drittdienst; abgelaufene Subscriptions werden beim Senden automatisch aufgeräumt.
   Deploy: `npx web-push generate-vapid-keys` → VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT
   in /etc/24pray-api.env; ohne Keys ist das Feature serverseitig aus und die Profil-Karte
   erklärt das ehrlich.)
8. ~~**Cookiefreies, aggregiertes Server-Zählen**~~ — GEBAUT 2026-07-09 (Tageszähler
   landing/list/watch per Seiten-Ping, booking serverseitig im Buchungs-Handler; gespeichert
   wird AUSSCHLIESSLICH date+step+count. Lesen: GET /stats/funnel?token=… — FUNNEL_TOKEN
   beim Deploy in /etc/24pray-api.env setzen, ohne Token antwortet der Endpoint 404.)
9. ~~**Feedback-Button + Open-Source-Hinweis**~~ (User-Zusatz 2026-07-09) — GEBAUT: Footer-
   „Feedback"-Dialog (Mail an FEEDBACK_TO, keine DB-Speicherung, ohne Login, fail-closed ohne
   Env) + GitHub-Icon-Link auf das öffentliche Repo in beiden Footern; „Auf GitHub melden"-Link
   im Dialog. FEEDBACK_TO beim Deploy in /etc/24pray-api.env setzen (Betreiber-Adresse — bewusst nur dort, nie im Repo).

## SEO (eigenes Paket, aus Review + früherem Merkposten)

- robots.txt + dynamische sitemap.xml (PUBLIC-Wachen), Canonical-URLs
- schema.org-Events pro Wache
- SSR-Inhalte für öffentliche Wachenseiten (derzeit client-gerendert → Crawler sehen wenig)
- hreflang erst NACH Entscheidung URL-basierte Locales (/es/…) — bewusste Architekturfrage!

## Kleinere Merkposten

- Guest-Booking-Adoption bei Konto-Erstellung (E-Mail-Match guestEmail→userId), damit „alle
  deine Stunden" auch Vor-Konto-Buchungen einschließt (Review P6, Low)
- returnTo-Parameter für den Login-Flow (Konversion aus einer Wache führt zurück zur Wache;
  vorbestehend, Review P6)
- API hinter nginx ohne trustProxy: req.ip ist immer 127.0.0.1 → ALLE Rate-Limits sind faktisch
  global statt pro IP (erklärt auch das bekannte magic-link-429-Symptom). Fix: fastify
  trustProxy + X-Forwarded-For, mit Tests (Review P8, repo-weit)
- Funnel-Ping sendet credentials:'include' mit (Session-Cookie bei Eingeloggten; gespeichert
  wird nichts) — reine Lehre: dedizierter fetch mit credentials:'omit' (Review P8, Low)
- FUNNEL_TOKEN lang+zufällig wählen (Query-String landet im nginx-Log); Header-Token wäre
  sauberer (Review P8, Low)
- Feedback-Dialog: API-Fehlertexte lokalisieren (404 „Nicht gefunden" nach Deploy ohne Env,
  429/Zod englisch) — eigene i18n-Fehlermeldung statt roher API-Message (Review P9, Low)
- me.ts deleteMe: pushSubscription nur via DB-Cascade geloescht (funktioniert), explizites
  tx.deleteMany waere konsistenter zum uebrigen tx-Muster (Review P7-F2, Kosmetik)
- sw.js notificationclick: navigate() auf uncontrolled Client kann rejecten (erster Besuch) —
  Klick fokussiert dann nur; Selbstheilung beim naechsten Load (Review P7-F3, Low)
- Wachen-Sprache nachträglich änderbar machen (UpdateProjectBody hat kein language-Feld; Review P5)
- Dashboard: Filter-Select vs. UI-Sprach-Umschalter besser unterscheidbar machen (Mini-Label/Filter-Icon; Review P5, Low)
- Alt-Mails (Buchung, Erinnerung, Verschiebung, Farewell) auf Empfänger-Locale umstellen
  (Locale liegt seit Backlog 1 am User/Slot; Katalog-Muster: `UPDATE_NOTICE_TEXTS` in mailer.ts)
- Update-Mail he/ar Texte: Muttersprachler-Review (zusammen mit bestehendem he/ar-Merkposten)
- Titel-Editing bestehender Wachen (Anliegen-Karte erweitern)
- PLZ-Suche für Orte <500 EW (GeoNames-Postal-Dump)
- Funnel: watch-Ping zählt auch 403/404-Aufrufe (Seitenaufruf ≠ erfolgreiche Ansicht) — falls
  später „erfolgreiche Ansicht"-Metrik gewünscht, Ping hinter den Load-Erfolg ziehen (Review P8)
- Muttersprachler-Review he/ar (Bidi-Kandidat: `pastFoldLabel` ar)
- Titelbild pro Wache (Design fertig, User-verworfen wegen Sizing — bei Bedarf reaktivieren;
  dann Backup um uploads/ erweitern + Datenschutz-Absatz)
- ScheduleCard im Tages-Modus zeigt Uhrzeit (kosmetisch)
- API-Startup-Guard: warnen/abbrechen wenn SMTP_URL gesetzt aber UNSUBSCRIBE_SECRET noch der Dev-Default ist (Review-Fund F2, Suppression-Angriff-Risiko bei vergessenem Secret)
- Wachen-Titel: max-Länge/Newline-Guard im CreateProjectBody (Review-Fund F5, Mail-Subject-Hygiene; pre-existing)
- POST /projects/:id/slots prüft kein canReadProject (Buchung auf PRIVATE-Wachen nur mit
  projectId möglich; cuid praktisch nicht ratbar) — Hardening: Check + invite-Mitgabe im
  bookSlot-Client (Review Backlog-4 F2)
- Web-Push iOS-Safari: Push nur als installierte Home-Screen-PWA — Profil-Karte sollte das
  erklären statt generisch zu scheitern; zudem Permission-Anfrage nach await-Roundtrips
  (User-Activation-Risiko Safari) prüfen (Review P7)
- Push-Test Owner-Ausschluss: kein push-spezifischer Test, dass der Owner beim eigenen Update
  keinen Push bekommt (transitiv gedeckt; Review P7, Low)
- Benachrichtigungs-Matrix: offene Zellen aus docs/NOTIFICATIONS.md (api-Repo) bewusst entscheiden
  (Push bei Verschiebung/Löschung, Owner-Push bei Buchung, Storno-Info — siehe Matrix)

## Beim User (nicht baubar)

- `gh auth refresh -h github.com -s workflow` → Uptime-Cron scharf schalten
- SMTP-Passwort-Rotation Strato → danach `/etc/24pray-api.env` aktualisieren
