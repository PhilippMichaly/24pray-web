# Gruppen-Links für Gebetsketten (WhatsApp / Telegram / Signal)

**Datum:** 2026-07-08 · **Status:** approved (User, Chat) · **Scope:** api + web

## Ziel
Ketten-Owner hinterlegen optional Links zu ihren parallelen Kommunikationskanälen
(WhatsApp-, Telegram-, Signal-Gruppe). Betrachter der Kette sehen gebrandete Buttons.

## Entscheidungen (User-bestätigt)
- **Eigene Felder + Buttons** statt Auto-Linkifizierung der Beschreibung.
- **Sichtbar für alle Kettenbetrachter** (öffentlich → jeder, privat → nur mit Invite-Link);
  die bestehende `canReadProject`-Logik regelt das automatisch.

## Datenmodell (api)
`PrayerProject`: `linkWhatsapp String?`, `linkTelegram String?`, `linkSignal String?` (Migration).

## Validierung (api, Zod — Create + Update)
Nur echte Dienst-Domains, nur `https://` (Anti-Phishing hinter offiziellen Buttons):
- WhatsApp: `https://chat.whatsapp.com/<code>`
- Telegram: `https://t.me/<pfad>` (auch `+`-Invites, `joinchat/…`)
- Signal: `https://signal.group/<token>` (inkl. `#`-Fragment)
Leeren = `null` im PATCH. Fehlermeldung nennt das erwartete Format.

## Web
- **Anlegen**: Formular Schritt 2, Abschnitt „Parallele Kommunikation (optional)", 3 Felder.
- **Nachträglich**: Organisator-Karte auf der Kettenseite (Muster LocationCard, PATCH).
- **Anzeige**: Button-Reihe unter dem Kettenkopf, nur gesetzte Dienste, Logos als
  eingebettete SVGs (keine externen Ressourcen — konform zur Datenschutzerklärung;
  Absprung zum Dienst erst beim Klick). `rel="noopener noreferrer"`, `target="_blank"`.
- i18n de/en.

## Tests
API: Validierung gültig/ungültig je Dienst, Felder in Response, PATCH inkl. Löschen (null).
Web: Button-Reihe rendert nur gesetzte Links mit korrekten hrefs; Formular schickt Felder.
E2E (Browser): Owner trägt Link ein → anonymer Betrachter sieht Button mit korrektem Ziel.
