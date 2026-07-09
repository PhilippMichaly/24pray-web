# 24pray — Design-Vision

> Grundlage für die technische Spec. Erarbeitet 2026-07-06 auf Basis des realen Codes
> (`24pray-web` + `24pray-api`), gerenderter Screenshots aller Screens inkl. der
> authentifizierten Kern-Screens (Dashboard, Projekt-Detail mit Slot-Liste, Desktop + 390px Mobile).
> Dieses Dokument definiert das **Was und Warum**; die Spec definiert das Wie.

## Stand 2026-07-09

Zwei intensive Feature-Tage seit der Erarbeitung dieser Vision. Das „Vigil"-Konzept
(„Gebetswache" statt „Gebetskette") ist produktiv umgesetzt und im gesamten Produkt
konsistent benannt (UI-Texte, Mails, API-Fehlermeldungen). Palette V3 im Einsatz.
Feinschliff an Lichtband/Kollaps-Darstellung des Slot-Grids abgeschlossen. Die
Statistik-Ansicht wurde nach dem `dataviz`-Skill neu gebaut (Hero-Zahl, Coverage-
Chart, Personen-Tabelle). 5 Sprachen inkl. RTL (de/en/es/he/ar) sind umgesetzt —
Details dazu in `docs/I18N.md`. Der historische Bewertungstext unten bleibt als
Ausgangspunkt unverändert stehen; viele der dort benannten Lücken (Slot-Grid-
Rohdarstellung, fehlende Komponenten-Schicht, Emoji-Icons) sind seither geschlossen.

---

## 0. Ehrliche Bewertung des Ist-Zustands

**Was trägt:**

- Die Farbtemperatur stimmt. Warmes Papier (`#FAF9F6`) + Bronze/Amber (`#C47D2A`) ist die
  richtige emotionale Grundlage: Kerze, Pergament, Stille. Das behalten und ausbauen.
- Die Typo-Paarung (Serif-Display + humanistische Sans) ist als Idee richtig.
- Landing und Login sind ruhig, zentriert, unaufgeregt — die Haltung passt.
- Die Architektur darunter ist sauber genug (klare API, Zod, Typen), um ein Design-System
  ohne Umbau-Schmerz einzuziehen.

**Was nicht trägt:**

- **Das Herzstück existiert visuell nicht.** Das „Slot-Grid" ist eine 48-zeilige `<ul>` mit
  rohen `toLocaleString()`-Timestamps („6.7.2026, 02:00:00 — frei") und einem blauen Button
  pro Zeile. Keine Tagesgruppierung, keine Zeit-Wahrnehmung (Nacht sieht aus wie Mittag),
  kein Jetzt-Marker, kein Fortschritt, kein Storno, keine Namen-Darstellung über Klartext
  hinaus. Für eine App, deren einziger Zweck „24 Stunden lückenlos füllen" ist, ist die
  Lücke nirgends sichtbar.
- **Zwei Designsprachen im selben Produkt.** Landing/Login nutzen das Brand-Token-System;
  Dashboard, Projekt-Detail, Projekt-anlegen und Join nutzen `bg-blue-600`, `text-red-600`,
  `border`-Defaults — Tailwind-Rohzustand. Wirkt wie zwei verschiedene Apps.
- **Keine Komponenten-Schicht.** Null Dateien unter `src/components/`. Jeder Button ist
  inline neu erfunden. Jede Design-Entscheidung muss heute n-fach editiert werden.
- **Kein Dark Mode**, keine Motion (außer einem Spinner), keine Empty-States über
  einen Textsatz hinaus, keine Skeletons, Fehler als roher roter String.
- **Emojis als Icons** (🙏 als Logo, ✉️ ✓ ✕ in Status-Screens) — plattformabhängig,
  nicht theming-fähig, wirkt provisorisch.
- **Zeitzonen-Blindheit im UI:** Das Projekt hat eine `timezone`, angezeigt wird aber die
  Browser-Locale-Zeit ohne jede Kennzeichnung. Für eine 24/7-Kette über Gemeindegrenzen
  hinweg ist das fachlich falsch, nicht nur hässlich.
- **UI-Lücken mit Produktwirkung:** Kein Storno-UI (API `DELETE /slots/:id` existiert),
  kein Invite-Link-UI (Token wird an den Organizer geliefert, aber nirgends angezeigt),
  Join-Flow ist eine Textzeile + Button, Guest-Booking-Formular fehlt komplett
  (obwohl `guestName`/`guestEmail` API-seitig da sind — das Kernversprechen „Kein Account
  nötig" ist im Frontend nicht eingelöst).

**Nebenbefunde (Bugs, an Opus weiterreichen):**

- CORS erlaubt nur `env.APP_URL`; `.env` stand auf `:3002`, Frontend läuft auf `:3000` →
  alle authentifizierten Fetches scheiterten mit „Failed to fetch". (Lokal auf `:3000` korrigiert.)
- `auth/verify/page.tsx` konsumiert den Single-Use-Token im `useEffect`; unter React-18-StrictMode
  (Dev) läuft der Effect doppelt → zweiter POST schlägt fehl → „Link ungültig" trotz Erfolg.
- `MembershipRole` existiert als TS-Typ, aber es gibt **keine Membership-Tabelle** im
  Prisma-Schema — Projekt-Mitgliedschaft ist derzeit nur implizit über gebuchte Slots.
- Authentifizierte Buchung mit `guestName` ignoriert den Gastnamen (Slot hängt am User).

---

## 1. Design-Sprache / Art Direction

### Konzept: „Vigil"

24pray gestaltet **Zeit, die jemand hält**. Die Anmutung: eine Kerze, die durch die Nacht
weitergereicht wird — warm, still, verlässlich. Ruhe ist hier keine Deko, sondern Funktion:
Die App darf nie hektischer sein als ein Gebet. Ein zweites, tragendes Motiv:
**die Kette** — Stunden als Glieder, Lücken als sichtbare offene Stellen, die geschlossen
werden wollen.

Drei Gestaltungsregeln, die aus den Domain-Werten folgen:

1. **Gemeinschaft sichtbar machen:** Namen und Initialen der Betenden sind First-Class-Inhalt,
   nicht Metadaten in Klammern.
2. **Kontinuität fühlbar machen:** Die laufende Stunde „lebt" (Jetzt-Marker), Tag und Nacht
   sind unterscheidbar, Lücken springen ins Auge.
3. **Niedrigschwelligkeit ernst nehmen:** Der Gast-Pfad (Join → Slot → Name eintippen → fertig)
   ist der am sorgfältigsten gestaltete Pfad der App, nicht der vernachlässigtste.

### 1.1 Farbsystem (semantische Tokens, Light + Dark)

Alle Farben leben als HSL-Triple in CSS-Custom-Properties (siehe §2), niemals als Hex im JSX.
Der bestehende Amber-Kern bleibt, wird aber kontrastfest gemacht: das heutige `#C47D2A` hat
auf Weiß nur ~3.1:1 und ist als Button-Fill mit weißem Text nicht AA-tauglich.

**Light („Morgenlicht auf Papier"):**

| Token | HSL | ≈ Hex | Verwendung |
|---|---|---|---|
| `--bg` | `40 33% 97%` | `#FAF8F4` | Seitenhintergrund, warmes Papier |
| `--surface` | `0 0% 100%` | `#FFFFFF` | Karten, Sheets, Inputs |
| `--surface-sunken` | `40 25% 94%` | `#F3F0EA` | Sekundärflächen, Zebra, Sekundär-Button |
| `--border` | `38 18% 87%` | `#E4E0D7` | Hairlines, Karten-Ränder |
| `--ink` | `35 20% 10%` | `#1F1B14` | Primärtext |
| `--ink-muted` | `35 8% 40%` | `#6E675C` | Sekundärtext (4.5:1 auf `--bg`) |
| `--accent` | `32 72% 38%` | `#A6621B` | Primäraktionen, Links (≥4.5:1 mit Weiß) |
| `--accent-strong` | `32 74% 30%` | `#864E13` | Hover/Active von `--accent` |
| `--accent-soft` | `36 64% 92%` | `#F7E8D3` | Tints, Selektion, eigene Slots (Hintergrund) |
| `--gold` | `40 85% 55%` | `#EDAE28` | Nur dekorativ: Flamme, Glow, Fortschritt-Highlights |
| `--night` | `250 22% 42%` | `#5A5383` | Nacht-Tint im Grid (nur als Alpha-Overlay 4–10%) |
| `--positive` | `150 40% 30%` | `#2E6B4D` | Bestätigungen, „Kette geschlossen" |
| `--danger` | `12 62% 42%` | `#AE3E28` | Fehler, Storno (warmes Rot, kein `red-600`) |
| `--focus` | `32 72% 38%` | — | Focus-Ring (2px, offset 2px) |

**Dark („Nachtwache" — warmes Anthrazit, kein Blau-Schwarz):**

| Token | HSL | ≈ Hex |
|---|---|---|
| `--bg` | `30 12% 8%` | `#17130E` |
| `--surface` | `30 12% 12%` | `#221D15` |
| `--surface-sunken` | `30 12% 10%` | `#1C1811` |
| `--border` | `32 10% 22%` | `#3E382E` |
| `--ink` | `38 28% 92%` | `#F1EBDF` |
| `--ink-muted` | `36 10% 62%` | `#A69E90` |
| `--accent` | `36 78% 60%` | `#E9A445` (dunkler Text `--bg` auf Accent-Fill) |
| `--accent-strong` | `36 82% 68%` | `#F0B968` |
| `--accent-soft` | `34 40% 18%` | `#3D2F1C` |
| `--gold` | `42 90% 62%` | `#F3BE3D` |
| `--night` | `250 26% 60%` | — (Alpha-Overlay wie Light) |
| `--positive` | `150 35% 55%` | `#5FB48B` |
| `--danger` | `12 70% 62%` | `#E1785C` |

Regeln: Statusfarben (frei/belegt/mein) werden **nie** allein über Farbe kommuniziert
(zusätzlich Form/Icon/Text — Farbfehlsichtigkeit). Schatten sind warm getönt
(`hsl(35 30% 10% / α)`), im Dark Mode ersetzt Border-Aufhellung die Elevation.

### 1.2 Typografie

| Rolle | Font | Fallback | Einsatz |
|---|---|---|---|
| Display | **Fraunces** (variable, `SOFT`-Achse ~50) | Playfair Display, serif | Wortmarke, H1/H2, Zahlen im Fortschrittsring |
| Body/UI | **DM Sans** (bestand) | system-ui, sans-serif | Alles andere |
| Zeit/Zahlen | DM Sans mit `font-variant-numeric: tabular-nums` | — | Slot-Zeiten, Countdowns, Statistiken. Kein separater Mono-Font nötig; falls gewünscht: DM Mono. |

Fraunces statt Playfair ist eine **Empfehlung, keine Pflicht** (Entscheidung → §7): wärmer,
weniger „Hochzeitseinladung", variable Achsen erlauben eine weiche Display-Stimme. Fonts
**self-hosten** via `next/font` (derzeit Google-Fonts-CSS-Import in `globals.css` — Latenz + Datenschutz).

Skala (Ratio 1.25, rem, Zeilenhöhen fix definiert):

```
--text-xs:   0.75rem/1rem      (12/16)  Meta, Badges
--text-sm:   0.875rem/1.25rem  (14/20)  Sekundärtext, Labels
--text-base: 1rem/1.5rem       (16/24)  Body
--text-lg:   1.25rem/1.75rem   (20/28)  Karten-Titel
--text-xl:   1.5625rem/2rem    (25/32)  H2, Sheet-Titel
--text-2xl:  1.953rem/2.25rem  (31/36)  H1 Screens (Display-Font)
--text-3xl:  2.441rem/2.75rem  (39/44)  Landing-Hero (Display-Font)
```

Display-Font nur ≥ `--text-xl`. UI-Text nie unter 14px, Slot-Zeiten immer tabular.

### 1.3 Spacing, Radius, Elevation

- **Spacing:** 4px-Basis, benutzte Stufen: 4/8/12/16/24/32/48/64. Screen-Padding mobil 20px
  (`px-5`), Desktop-Content max. `max-w-3xl` für Lese-Screens, `max-w-5xl` für das Grid.
- **Radius:** `--radius-sm: 8px` (Inputs, Zellen), `--radius-md: 12px` (Buttons, Karten),
  `--radius-lg: 20px` (Sheets, Modals, Hero-Karten), `--radius-full` (Pills, Avatare).
  Weich, aber nicht blobby — keine 24px+-Radien auf kleinen Elementen.
- **Elevation:** 3 Stufen, warm getönt:
  - `--shadow-1: 0 1px 2px hsl(35 30% 10% / 0.05)` — Karten ruhend
  - `--shadow-2: 0 2px 8px hsl(35 30% 10% / 0.08)` — Hover, Dropdowns
  - `--shadow-3: 0 8px 32px hsl(35 30% 10% / 0.14)` — Sheets, Dialoge
  - Dark Mode: Schatten fast unsichtbar, stattdessen `--border` eine Stufe heller.

### 1.4 Ikonografie

**Lucide** (React-Paket, tree-shakeable), Stroke 1.75, Größen 16/20/24. Alle Emoji-Icons
ersetzen. Domänen-Icons: `flame` (Jetzt/aktive Stunde), `link` (Kette/Invite), `moon`/`sun`
(Nachtzeit-Kennzeichnung), `hand-heart` o. ä. als Fallback. **Logo:** eigene Wortmarke
„24pray" in Fraunces mit einem gestalteten Zeichen (Flamme im Zifferblattkreis als
Monogramm, SVG) — das 🙏-Emoji im App-Icon-Container fällt weg.

### 1.5 Motion-Prinzipien

„Die App atmet, sie zappelt nicht."

- **Durations:** 150ms (Hover, Toggle) / 250ms (Zell-Fill, Sheet-Content) / 400ms
  (Sheet/Dialog Ein-/Ausfahren). Nichts über 500ms außer Ambient-Loops.
- **Easing:** `cubic-bezier(0.2, 0, 0, 1)` (entschlossen rein, sanft aus) für Eintritt,
  `ease-in` nur für Austritt.
- **Ambient (einziger Loop):** der Jetzt-Marker „atmet" — Opacity 0.65→1, Scale 1→1.03,
  4s ease-in-out alternate. Wie eine Kerzenflamme, nicht wie ein Notification-Badge.
- **Buchung:** Zelle füllt sich radial vom Tap-Punkt (250ms); wenn dadurch zwei belegte
  Nachbarn verbunden werden, glimmt der Verbindungssteg einmal kurz auf (`--gold`, 400ms) —
  „die Kette schließt sich". Kein Konfetti, nie.
- **Fehler:** 1 dezenter Horizontal-Shake (2×4px, 150ms) + Toast. Kein Rot-Blinken.
- `prefers-reduced-motion`: alle Loops aus, Transitions auf Opacity-only.

---

## 2. Design-System-Architektur

### 2.1 Token-Ebenen

```
globals.css
├─ :root                  → Light-Tokens (§1.1) + Typo/Radius/Shadow/Motion-Tokens
├─ [data-theme="dark"]    → Dark-Overrides (nur Farb-Tokens)
└─ @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) … }
```

- Theme-Switching class-/attribut-basiert (`next-themes` oder 15-Zeilen-Eigenbau mit
  `localStorage` + Attribut auf `<html>`), Default = System.
- Tailwind konsumiert Tokens via `hsl(var(--accent) / <alpha-value>)` in
  `tailwind.config.ts` → Utilities heißen semantisch: `bg-surface`, `text-ink-muted`,
  `border-border`, `bg-accent`. **Verbot:** Roh-Palette (`blue-600`, `gray-600`, `red-600`)
  im App-Code; die `brand`-Hex-Skala in `tailwind.config.ts` wird durch die semantische
  Ebene ersetzt (Hex-Skala darf als Referenz unter `colors.brand` bleiben, wird aber im
  JSX nicht verwendet).
- Komponenten-Tokens (zweite Ebene, nur wo nötig): `--slot-free-bg`, `--slot-booked-bg`,
  `--slot-mine-bg`, `--slot-night-overlay`, `--chain-gap-color`. So kann White-Label (§5)
  später Slot-Farben unabhängig vom Rest umhängen.

### 2.2 Komponenten-Inventar (Primitives → Patterns → Screens)

```
src/components/
├─ ui/            ← Primitives, dumm, nur Props+Tokens (cva für Varianten)
│  Button (primary/secondary/ghost/danger · sm/md/lg)
│  Input, Textarea, Select, Label, FieldError
│  Card, Badge, Avatar (Initialen-Fallback), Divider
│  Sheet (Bottom-Sheet mobil / Dialog ≥md), Toast (Undo-fähig), Tooltip
│  Skeleton, Spinner, EmptyState (Icon+Titel+Text+CTA), Tabs, Progress
├─ patterns/      ← Domänen-Muster, komponieren Primitives
│  AppShell (TopBar: Wortmarke, ThemeToggle, Avatar-Menü; schmaler Footer)
│  ProjectCard (Titel, ChainBand-Mini, Fortschritt, nächster eigener Slot)
│  ChainProgress (Zahl + segmentiertes Band oder Ring, „größte Lücke"-Hint)
│  ChainBand (24h-Heatmap-Leiste, ein Tag = eine Zeile)
│  InviteCard (Link + Copy + QR optional, nur Organizer)
│  NextSlotCard („Dein nächster Slot: heute 21–22 Uhr")
│  TimezoneHint (Projekt-TZ ≠ Browser-TZ → „bei dir: 14:00")
└─ slots/         ← Das Herzstück (§3)
   SlotList, DaySection, SlotRow, SlotCell, NowMarker,
   SlotSheet (Detail/Buchen/Stornieren), GuestBookingForm
```

Screens (`app/**/page.tsx`) enthalten danach **nur noch** Datenbeschaffung + Komposition.
Erweiterungspunkte für Opus: neue Features docken als `patterns/`-Komponente + Tab im
Projekt-Detail an (§5); neue Themes als Token-Satz; neue Sprachen als Katalog in `lib/i18n`.

### 2.3 Bestehendes, das bleibt

`api.ts` (Client), `use-auth.ts`, Zod-Typen — unverändert nutzbar. `i18n.ts` (`t()`) wird
zum echten Katalog ausgebaut (alle heute hartkodierten deutschen Strings → Keys, §5).

---

## 3. Das Slot-Grid — Herzstück

### 3.1 Mentales Modell

Nicht „Liste von Terminen", sondern **„eine Kette aus Stunden, die wir gemeinsam halten"**.
Zwei synchronisierte Darstellungen auf einer Seite:

1. **ChainBand (Überblick, oben):** Pro Projekttag eine horizontale Leiste aus 24 Zellen
   (bei 48h-Projekt: 2 Zeilen). Jede Zelle 100%-flexibel breit (Grid `grid-cols-24`),
   Höhe 10–12px, Radius 3px, Gap 2px. Farbcodierung: frei = `--surface-sunken` mit
   Border, belegt = `--accent` 55% Alpha, meine = `--accent` voll + 1px Gold-Ring,
   vergangen = 35% Opacity, Jetzt = atmender Gold-Dot über der Zelle. Nachtstunden
   (22–06 Projekt-TZ) tragen zusätzlich den `--night`-Alpha-Tint + ein 12px-Mond-Glyph
   am Zeilenanfang. **Funktion:** Ketten-Zustand auf einen Blick + Klick/Tap scrollt zur
   Stunde in der Liste. Auf Mobile bleibt das Band voll sichtbar (24 Zellen × ~14px bei
   390px — Heatmap, kein Präzisions-Target; die Buchung passiert in der Liste).

2. **SlotList (Handlung, darunter):** Gruppiert in `DaySection`s mit Sticky-Header
   („Montag, 6. Juli" + Tages-Fortschritt „14/24"). Jede Stunde eine `SlotRow`,
   Höhe 52px (Touch-Target ≥44px):
   - Links: Zeitspanne in tabular figures, Projekt-TZ: **„02–03"** (nicht
     „6.7.2026, 02:00:00"). Nachtstunden mit dezentem Mond-Icon.
   - Mitte: Zustand. Frei: „Noch offen" in `--ink-muted`. Belegt: Avatar (Initialen) +
     Name. Meine: Avatar + „Du" + Accent-Tint auf der ganzen Zeile.
   - Rechts: Aktion. Frei: „Übernehmen" (Secondary-Button, wird Primary on-hover/-focus).
     Meine: Overflow → Stornieren. Fremde: nichts.

### 3.2 Zustands-Matrix (verbindlich für die Spec)

| Zustand | Fläche | Kennzeichnung | Interaktion |
|---|---|---|---|
| `FREE` | `--surface`, gestrichelte 1px-Border | „Noch offen" | Row-Klick oder Button → Buchen |
| `FREE` in größter Lücke | zusätzlich schwacher `--gold`-Tint | „Schließt die größte Lücke" Micro-Label | wie FREE |
| `BOOKED` (fremd) | `--surface-sunken` | Avatar + Name | Klick → SlotSheet (nur Info: wer, wann) |
| `MINE` | `--accent-soft` | Avatar + „Du" + Ring | Klick → SlotSheet mit Stornieren + (später) „jede Woche" |
| `PAST` | 40% Opacity, keine Aktion | — | Vergangene Tage default eingeklappt („12 Stunden vergangen — anzeigen") |
| `NOW` | wie Grundzustand + linke 3px-Gold-Kante | atmender Flame-Dot + „Jetzt betet Ruth" / „Diese Stunde ist noch offen — bete jetzt" | NOW+FREE bucht sofort die laufende Stunde |
| `PENDING` (optimistic) | Zielzustand mit 60% Opacity | Mini-Spinner im Button | — |
| `CONFLICT` (Double-Book-Guard, API 409) | rollt zurück | Shake + Toast „Diese Stunde hat gerade Jonas übernommen" | Liste refresht |

### 3.3 Buchungs-Flow

- **Eingeloggt:** Ein Klick → optimistic update → Undo-Toast („Stunde übernommen · Rückgängig",
  6s). Kein Bestätigungs-Dialog — Verbindlichkeit entsteht durch die Undo-Schwelle, nicht
  durch Friction davor.
- **Gast (Join-Flow):** Klick → Bottom-Sheet `GuestBookingForm`: Slot-Rekap (beide Zeitzonen),
  Name (Pflicht), E-Mail (Pflicht, „für deine Erinnerung"), CTA „Diese Stunde übernehmen".
  Nach Erfolg: Bestätigungs-State im Sheet mit `.ics`-Download („In Kalender eintragen")
  und dezentem Account-Angebot. Maximal ein Formular, niemals ein Login-Zwang auf diesem Pfad.
- **Storno:** Nur im SlotSheet (nicht als Row-Button — versehentliches Storno wäre der
  teuerste Fehler der App). Sheet-CTA „Stunde freigeben" (Danger-Ghost) + eine Rückfrage.

### 3.4 Fortschritt der Kette

Kopfbereich des Projekt-Details, `ChainProgress`:

- Primärzahl im Display-Font: **„31 von 48 Stunden gehalten"** + segmentiertes Band
  (identisch zum ChainBand, aggregiert).
- Sekundär-Hinweis mit Handlungsenergie: „Größte Lücke: Di 03–06 Uhr" als Link → scrollt
  zur Lücke (die drei Zellen pulsieren einmal). Lücken sind das zentrale Objekt der
  Aufmerksamkeit — die Kette lebt davon, dass Lücken jemanden finden.
- 100% erreicht: Band wird durchgehend gold, Text „Die Kette ist geschlossen." — statisch
  würdig, keine Party-Animation.

### 3.5 Zeit-Wahrnehmung & Zeitzonen

- Alle Zeiten in **Projekt-Timezone** (via `Intl.DateTimeFormat` mit `timeZone`), Format
  `HH–HH` bzw. `HH:mm` bei Sub-Stunden-Slots (Zukunft).
- Weicht die Browser-TZ ab: `TimezoneHint`-Badge im Header („Zeiten in Europe/Berlin") und
  im SlotSheet beide Zeiten („03–04 Uhr · bei dir 05–06").
- Tag/Nacht-Codierung (§3.1) macht die unattraktiven Nachtstunden ehrlich sichtbar, statt
  sie zu verstecken — wer 03:00 übernimmt, tut es bewusst; das UI darf diese Slots leise
  adeln (Mond + „Nachtwache"-Micro-Label im Sheet).

### 3.6 Leerzustände

- **0 Buchungen:** Kein leeres Grid-Grau. Erste Zelle des Bandes glimmt; über der Liste:
  „Noch hält niemand eine Stunde. Sei die erste Kerze." + CTA auf die Startstunde.
- **Projekt `DRAFT`:** Banner „Noch nicht gestartet — teile den Link, wenn du bereit bist".
- **Projekt vorbei:** Grid wird zur Rückschau: Band final, „48 Stunden, 17 Betende. Danke."
  (+ Statistik-Andockpunkt, §5).

### 3.7 Dichte & Zukunft (15/30-min-Slots)

`SlotRow`-Höhe bleibt konstant; Sub-Stunden-Slots erscheinen als Segmente **innerhalb**
der Stundenzeile (Accordion: Stunde aufklappen → 2/4 Teil-Rows). Das ChainBand behält
24 Zellen/Tag; Teil-Belegung einer Stunde = anteiliger Fill der Zelle. Damit skaliert die
Informationsdichte, ohne dass das Layout kippt. (Datenmodell dafür: §5.)

---

## 4. Screen-für-Screen-Richtung

**Landing (`(public)/page.tsx`)** — Bleibt ein ruhiger Single-Screen, bekommt aber das
Produkt ins Bild: unter der Wortmarke ein dekoratives, langsam sich füllendes ChainBand
(pure CSS-Animation, 24 Zellen, ~20s Loop, reduced-motion-safe) statt des Emoji-Logos.
Dreizeiler der Werte („Rund um die Uhr · Gemeinsam · Verbindlich"), zwei CTAs wie gehabt,
„Kein Account nötig zum Mitmachen" wird vom Fußnoten-Grau zum sichtbaren Badge über den CTAs.

**Login + Verify (`auth/*`)** — Struktur ist richtig, nur materialisieren: Inhalt in eine
`Card` auf `--bg`, Emojis → Lucide, Sent-State mit „Erneut senden"-Link (Timer 60s).
Verify-Error bekommt einen Ausweg: CTA „Neuen Link anfordern" (heute Sackgasse). Der
StrictMode-Doppel-Consume-Bug (§0) wird hier mitgefixt (Token-POST idempotent absichern
oder Effect-Guard).

**Dashboard** — Antwortet zuerst auf „**Wann bete ich?**", dann auf „Was organisiere ich?":
Oben `NextSlotCard`(s) („Heute, 21–22 Uhr · Gebetskette für Lena" + Countdown ab T−1h),
darunter Projektkarten mit Mini-ChainBand + Fortschritt + Status-Badge (übersetzt, nicht
`ACTIVE` roh). Empty-State: EmptyState-Pattern mit „Starte deine erste Gebetskette" +
sekundär „Oder tritt per Einladungslink bei".

**Projekt-Detail** — Aufbau: Header (Titel Display-Font, Beschreibung, Organizer,
TZ-Badge, Status) → `ChainProgress` → `InviteCard` (nur Organizer; heute fehlt jedes
Invite-UI!) → ChainBand → SlotList. Als Tab-Container angelegt („Kette" aktiv; „Anliegen",
„Statistik" als spätere Tabs, §5). Eigene kommende Slots als Pin unter dem Header.

**Projekt anlegen** — Vom Rohformular zum geführten Zweischritt: (1) „Worum geht es?"
Titel + Anlass/Beschreibung; (2) „Wann?" Start (Datum + Uhrzeit-Preset) + **Dauer-Presets**
(24h / 48h / 72h / 1 Woche / eigene) statt zweier `datetime-local`-Felder, Sichtbarkeit
als Radio-Cards. Live-Zusammenfassung: „Ergibt 48 Stunden-Slots, endet Mi 00:00". Nach dem
Anlegen sofort der Share-Moment: Redirect auf Projekt-Detail mit geöffneter InviteCard.

**Join-Flow (`join/[token]`)** — Der wichtigste Conversion-Pfad, gestaltet als
**Einladungskarte**: „_Miriam_ lädt dich ein" (Absender zuerst — die Einladung ist
persönlich), Projekttitel im Display-Font, Beschreibung, ChainProgress, CTA „Eine Stunde
übernehmen" → Projekt-Detail im Gast-Modus (Buchen via GuestBookingForm, §3.3). Kein
Login-Gate; „Anmelden" nur als leiser Sekundärlink.

---

## 5. Erweiterbarkeit / Zukunft

Struktur, die **jetzt** gelegt wird, damit spätere Features andocken statt umbauen:

**Frontend-Verankerung**

- Tabs im Projekt-Detail (§4) → „Anliegen"-Feed, „Statistik" werden Tabs, kein Redesign.
- SlotSheet ist der Andockpunkt für Slot-bezogene Features: „Jede Woche übernehmen"
  (Recurring), „Erinnere mich" (Notifications), Übergabe-Notiz an den Nächsten.
- Alle Strings über `t()`-Katalog (de vollständig, en-Skeleton) + alle Datumsformate über
  ein zentrales `lib/time.ts` (Intl, Projekt-TZ) → i18n ist danach Katalog-Arbeit.
- Theming/White-Label: Themes = Token-Sätze via `data-theme`; Logo/Wortmarke als
  austauschbare `Brand`-Komponente in der AppShell. Eine Gemeinde-Instanz mit eigener
  Farbe ist dann Konfiguration, kein Fork.

**Datenmodell (Prisma) — Erweiterungs-Oberfläche für Opus**

| Feature | Schema-Bedarf | Anmerkung |
|---|---|---|
| Variable Slot-Länge | `PrayerProject.slotDurationMinutes Int @default(60)` | Heute hart 60min in `src/lib/slotGrid.ts` (`SLOT_MS`) **und dupliziert** in `projectView.ts` (`totalSlots`-Berechnung) — beide Stellen auf das Feld umziehen. |
| Wiederkehrende Slots | `RecurringCommitment` (userId, projectId, weekday, hourStart, active) | Grid-Merge serverseitig in `buildSlotGrid`; UI: SlotSheet-Toggle. |
| Erinnerungen | `ReminderPreference` (slotId/userId, channel, minutesBefore) + Job-Runner | `notifyChannel` (EMAIL/TELEGRAM) existiert bereits pro Slot; `User.telegramChatId` existiert. |
| Anliegen-Feed | `PrayerRequest` (projectId, authorName/userId, text, createdAt) + optional `prayedCount` | UI: Tab; auch für Gäste beschreib-/lesbar (Niedrigschwelligkeit). |
| Statistiken | kein neues Schema nötig | `SlotStatus.COMPLETED` existiert ungenutzt — Completion-Job (Slot vorbei → COMPLETED) einführen, dann sind „gehaltene Stunden/Person" abfragbar. |
| Teams/Gemeinden | `Membership` (userId, projectId, role) — **fehlt heute**, obwohl `MembershipRole` als TS-Typ existiert; später optional `Organization` über Projekten | Ohne Membership gibt es kein „Mitglied ohne Buchung" — für Feed/Notifs nötig. |
| Gast-Identität | `PrayerSlot.guestToken` (Secret-Link fürs Selbst-Storno von Gast-Slots) | Heute können Gäste nicht stornieren — UX-Loch im Kernpfad. |

**API-Flächen:** `SlotView` um `slotId` + `isMine` erweitern (heute muss das Frontend
Storno-IDs raten bzw. kann eigene Slots nicht identifizieren — `userName`-Stringvergleich
ist keine Identität).

---

## 6. Priorisierte Roadmap (3 Wellen)

**Welle 1 — Foundation (Design-System steht)**
- Token-System in `globals.css` (Light + Dark komplett, §1.1) + Tailwind-Mapping semantisch;
  Roh-Palette-Verbot per ESLint-Regel oder Review-Konvention.
- `next/font`-Self-Hosting (Fraunces-Entscheidung §7), Typo-Skala, Lucide einführen,
  Emojis raus, Wortmarke/Monogramm (SVG).
- Primitives (`ui/`): Button, Input, Card, Sheet, Toast, Avatar, Badge, EmptyState,
  Skeleton, Tabs. AppShell mit TopBar + ThemeToggle.
- `lib/time.ts` (Projekt-TZ-Formatierung) + `t()`-Katalog-Ausbau.
- Altlasten: alle `blue-600/red-600/gray-*`-Screens auf Tokens+Primitives;
  Verify-Doppel-Consume-Fix; CORS/`APP_URL`-Doku.

**Welle 2 — Kern-Politur (das Herzstück wird das Herzstück)**
- Slot-Modul komplett (§3): ChainBand, DaySection/SlotRow, Zustands-Matrix, NowMarker,
  SlotSheet mit Buchen/Storno, optimistic booking + Undo-Toast, Conflict-Handling.
- ChainProgress + „größte Lücke"-Mechanik; Leerzustände.
- API-Erweiterung: `slotId`/`isMine` in `SlotView`, `slotDurationMinutes`-Feld (Default 60).
- Dashboard neu (NextSlotCard, ProjectCards mit Mini-Band); InviteCard im Projekt-Detail.
- Join-Flow als Einladungskarte + GuestBookingForm + `.ics`-Download + `guestToken`-Storno.
- Projekt-anlegen als Zweischritt mit Dauer-Presets.

**Welle 3 — Ausbau (Wachstum ohne Umbau)**
- Motion-Feinschliff (Ketten-Glow, Band-Animation Landing), Dark-Mode-QA auf allen Screens.
- Statistik-Tab (COMPLETED-Job zuerst), Anliegen-Feed-Tab.
- RecurringCommitment + Reminder-Preferences (E-Mail zuerst, Telegram existiert im Modell).
- i18n en, PWA-Manifest + Installierbarkeit (Gebets-Apps leben auf dem Homescreen),
  White-Label-Theme-Mechanik produktisieren.

---

## 7. Handoff an Opus

**Fixpunkte (nicht neu verhandeln, direkt spezifizieren):**

1. Token-Tabellen §1.1 (Light + Dark) und Architektur §2.1 sind die Farb-Wahrheit;
   Kontraste beim Feintuning gegen WCAG AA (≥4.5:1 Text, ≥3:1 UI-Grenzen) prüfen und
   HSL-Werte nötigenfalls in Helligkeit nachjustieren — Hue bleibt.
2. Slot-Zustands-Matrix §3.2 und Buchungs-Flow §3.3 (optimistic + Undo für User,
   Sheet-Formular für Gäste, Storno nur im Sheet) sind verbindliches Verhalten.
3. Zeiten immer in Projekt-TZ + `TimezoneHint`; tabular-nums; nie rohe `toLocaleString()`.
4. ChainBand (24 Zellen/Tag) + SlotList als Doppel-Darstellung; Band ist auf Mobile
   Heatmap/Navigation, kein Buchungs-Target.
5. Komponenten-Schichtung §2.2 (`ui/` → `patterns/` → `slots/`), Screens nur Komposition.
6. Motion-Budget §1.5 inkl. `prefers-reduced-motion`; einziger Loop = Jetzt-Marker.
7. Keine Emojis als UI-Icons; Lucide; eigene SVG-Wortmarke.

**Offene Entscheidungen (in der Spec treffen und begründen):**

- **Display-Font:** Fraunces (empfohlen) vs. Playfair behalten — Lizenz gleich (OFL),
  Entscheidungskriterium: Rendering-Qualität der Ziffern im ChainProgress.
- **Theme-Lib:** `next-themes` vs. Mini-Eigenbau (FOUC-Handling im App Router beachten).
- **Optimistic Booking für Gäste:** empfohlen nein (Formular-Sheet ist ohnehin ein Schritt);
  bestätigen oder verwerfen.
- **ChainBand-Interaktivität Desktop:** nur Scroll-Navigation (empfohlen) oder
  Hover-Tooltip + Direktbuchung ab ≥lg.
- **Namen-Sichtbarkeit:** Klarname aller Betenden für alle Projektteilnehmer sichtbar
  (heutiges Verhalten) vs. Privacy-Option „nur Initialen für Gäste" — Produktentscheidung
  mit Datenschutz-Dimension.
- **Datenmodell-Migrationen** aus §5: Reihenfolge und ob `Membership` schon in Welle 2
  (Voraussetzung für saubere `isMine`/Rollen-Logik) oder erst Welle 3 kommt.

**Bekannte Bugs, die die Spec mit einplanen muss (§0):** Verify-StrictMode-Doppel-Consume,
CORS-`APP_URL`-Kopplung (Doku/env-Beispiel), fehlende Storno-/Invite-UI, `MembershipRole`
ohne Tabelle, Gast-Buchung im eingeloggten Zustand ignoriert `guestName`.

**Referenz-Screenshots** (Ist-Zustand, lokal erzeugt am 2026-07-06): Landing, Login,
Dashboard (auth), Projekt-Detail 48-Slot-Liste Desktop 1280px + Mobile 390px — Seed:
Projekt „Gebetskette für Lena", 48h, 7 Buchungen.
