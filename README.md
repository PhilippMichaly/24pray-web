# 24pray Web

Frontend der Gebetsketten-Plattform **https://24pray.org** — Communities
organisieren 24/7-Gebet, indem Teilnehmer Stunden-Slots einer Kette übernehmen.

## Stack

- **Next.js 14** (App Router, TypeScript), **TailwindCSS** (semantische Tokens,
  Light/Dark via `next-themes`), **Zustand**, **Zod**, **Radix** (Dialog/Tabs/Tooltip),
  **Lucide** Icons, Fraunces + DM Sans (self-hosted via `next/font`)
- Landing-Signature: interaktive **NASA-Erde** (Canvas, Blue/Black-Marble-Texturen
  unter `public/earth/`, Drag-Rotation, Nerven-Netz aus echten Gebets-Standorten)
- PWA (Manifest + Icons unter `public/`)

## Entwicklung

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev                    # http://localhost:3000
```

Dazu die API starten (Repo `24pray-server`, `npm run dev` → :3001). Ohne
`SMTP_URL` läuft der **Testmodus-Login**: die Login-Seite zeigt einen
Direkt-Button, kein Postfach nötig.

```bash
npm test          # Vitest (lib/time, Slot-Zustandslogik)
npx next lint     # inkl. Roh-Paletten-Verbot (nur semantische Farb-Tokens)
npx tsc --noEmit
```

⚠️ Nie `npm run build` neben laufendem `npm run dev` — beide teilen `.next/`,
der Dev-Server verliert sonst seine Assets.

## Funktionsumfang (Stand 2026-07-09)

- Gebetswachen in Stunden- ODER Tages-Aufteilung (`slotDurationMinutes` 60 | 1440,
  pro Kette fest gewählt bei Erstellung)
- Gast-Buchung ohne Konto (E-Mail optional) mit Storno-Token — Gast kann seinen Slot
  ohne Login wieder stornieren
- Owner-Lebenszyklus: Anliegen pflegen, Ort setzen, Gruppen-Links (WhatsApp/Telegram/
  Signal), Zeitplan verschieben (alle Slots wandern im Delta mit), Wache löschen
  (Benachrichtigungs-Mails an alle mit künftigen Buchungen)
- Owner-Update-Feed („Neues") — eine Wache = ein Anliegen, nur der Ersteller postet
  Updates dazu
- Namens-Abkürzung als Opt-in pro Wache (Default: Klartext)
- 5 Sprachen (de/en/es/he/ar) mit RTL-Unterstützung + Browser-Spracherkennung +
  Sprachmenü (siehe `docs/I18N.md`)
- OpenGraph-Vorschau pro Wache + Teilen-Button (mit erklärendem Clipboard-Fallback)
- Statistik-Tab (Hero-Zahl, 24h-Coverage-Chart im Stunden-Modus, Personen-Tabelle)
- Login per Magic-Link ODER 6-stelligem Code (praktisch für ein anderes Gerät)
- Profil (Anzeigename ändern, Konto löschen)
- Impressum + Datenschutzerklärung (bewusst nur Deutsch — Rechtsseiten)

## Struktur

```
src/app/            Screens (Landing, auth/, dashboard, projects/, join/)
src/components/ui/       Primitives (Button, Sheet, Toast, …)
src/components/patterns/ Domänen-Muster (Brand, Globe, AppShell, InviteCard, …)
src/components/slots/    Herzstück: Slot-Grid (ChainBand, SlotList, SlotSheet, Logik+Store)
src/lib/            api-Client, time (Projekt-TZ), i18n (5 Sprachen typvollständig,
                    siehe docs/I18N.md), cities (Ort-Autocomplete),
                    mylocation („Mein Ort", localStorage)
docs/               DESIGN-VISION.md · I18N.md · specs/ (technische Spec) · WHITE-LABEL.md
```

## Design-System

- `docs/DESIGN-VISION.md` — Konzept „Vigil" / Palette „Kraft der Morgenröte"
- `docs/specs/2026-07-06-design-system-and-slot-grid-spec.md` — verbindliche Spec
  (Tokens, Komponenten-Contracts, Slot-Zustands-Matrix)
- `docs/WHITE-LABEL.md` — eigene Instanz einfärben (reiner Token-Swap)

## Deployment (Produktion)

Läuft auf einem VPS hinter nginx zusammen mit der API (eine Origin,
`NEXT_PUBLIC_API_URL=/api` → kein CORS, kein Rebuild bei Domain-Wechsel).
**Vollständiges, reproduzierbares Runbook:** `24pray-server/deploy/README.md`
(Erst-Setup, Update-Deploy, HTTPS, SMTP, Betrieb).
