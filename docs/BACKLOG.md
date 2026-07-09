# 24pray — Backlog (priorisiert)

Stand 2026-07-09. Quelle: Web2-Experten-Review (Session 08./09.07.) + gesammelte Merkposten.
Arbeitsmodus für die Umsetzungs-Session: Skill `24pray-ops` laden, Sonnet-Worker + Advisor-Muster.

## Paket „Web2-Loops" (Review-Erkenntnisse, in dieser Reihenfolge)

1. ~~**Update-Benachrichtigung an Beter**~~ — GEBAUT 2026-07-09 (lokalisierte Mail in 5 Sprachen
   an alle Teilnehmer, HMAC-Abmelde-Link, Share pro Update (WhatsApp/Telegram/Signal-System-Share);
   Empfänger-Locale wird seitdem bei Login/Buchung erfasst). DEPLOY AUSSTEHEND — vorher
   `UNSUBSCRIBE_SECRET` in `/etc/24pray-api.env` setzen (`openssl rand -base64 32`); Schema
   geändert ⇒ auf dem VPS `npx prisma generate` nicht vergessen. Mail-i18n der ALT-Mails =
   neuer Merkposten unten.
2. **Kumulative Zahlen + Schwellwert** — Landing/Dashboard: „Bereits N Stunden gemeinsam
   gebetet" (kumulativ, COMPLETED gesamt) statt kleiner Live-Zahlen; Live-Zahlen unter
   Schwelle (z. B. <5) ausblenden. Kaltstart-Wahrnehmung.
3. **Über-uns-/Werte-Seite** — wer steht dahinter, Glaubensbasis, warum kostenlos/werbefrei,
   Datensparsamkeit als Haltung. Vertrauensfundament im Gebets-Kontext. Reiner Text + Footer-Link.
4. **Einladungs-Moment nach Buchung** — Erfolgs-Screen + Bestätigungsmail: „Lade jemanden ein,
   die Stunde neben dir zu übernehmen" (Share-/Copy-Link auf die Wache). Virale Geste am
   Punkt höchster Motivation.
5. **Listen-Filter im Dashboard** — mindestens Sprache (Wache bekommt language-Feld beim
   Anlegen, default = UI-Sprache), sortiert nach „braucht Hilfe" (größte Lücke zuerst?);
   Vorstufe zu Kategorien.
6. **Konto-Nutzen sichtbar machen** — nach Gast-Buchung + auf Login-Seite: was ein Konto
   bringt (alle meine Stunden, Erinnerungs-Einstellungen, Name). Sanfte Konversion, kein Zwang.
7. **Web-Push (PWA)** — opt-in für Stunden-Erinnerung + Owner-Updates; ohne Dritt-Dienst
   (VAPID self-hosted). Zweiter Kanal neben Mail.
8. **Cookiefreies, aggregiertes Server-Zählen** — nur Pfad-Zähler (Landing→Sheet→Wache→Buchung),
   keine Personenbezüge, kein Banner nötig. Beendet die Funnel-Blindheit werte-konform.

## SEO (eigenes Paket, aus Review + früherem Merkposten)

- robots.txt + dynamische sitemap.xml (PUBLIC-Wachen), Canonical-URLs
- schema.org-Events pro Wache
- SSR-Inhalte für öffentliche Wachenseiten (derzeit client-gerendert → Crawler sehen wenig)
- hreflang erst NACH Entscheidung URL-basierte Locales (/es/…) — bewusste Architekturfrage!

## Kleinere Merkposten

- Alt-Mails (Buchung, Erinnerung, Verschiebung, Farewell) auf Empfänger-Locale umstellen
  (Locale liegt seit Backlog 1 am User/Slot; Katalog-Muster: `UPDATE_NOTICE_TEXTS` in mailer.ts)
- Update-Mail he/ar Texte: Muttersprachler-Review (zusammen mit bestehendem he/ar-Merkposten)
- Titel-Editing bestehender Wachen (Anliegen-Karte erweitern)
- PLZ-Suche für Orte <500 EW (GeoNames-Postal-Dump)
- Muttersprachler-Review he/ar (Bidi-Kandidat: `pastFoldLabel` ar)
- Titelbild pro Wache (Design fertig, User-verworfen wegen Sizing — bei Bedarf reaktivieren;
  dann Backup um uploads/ erweitern + Datenschutz-Absatz)
- ScheduleCard im Tages-Modus zeigt Uhrzeit (kosmetisch)

## Beim User (nicht baubar)

- `gh auth refresh -h github.com -s workflow` → Uptime-Cron scharf schalten
- SMTP-Passwort-Rotation Strato → danach `/etc/24pray-api.env` aktualisieren
