# 24pray — Design-System & Slot-Grid — Technische Spec

> **Status:** Approved (Bau-Anleitung)
> **Datum:** 2026-07-06
> **Quelle der Wahrheit (Design):** [`docs/DESIGN-VISION.md`](../DESIGN-VISION.md) — Konzept „Vigil", Token-System, Slot-Grid, 3-Wellen-Roadmap.
> **Diese Spec:** definiert das *Wie* — Datei-für-Datei, Contract-für-Contract, Milestone-für-Milestone. Kein „ich würde"; jeder Punkt ist umsetzbar ohne Design-Entscheidungen neu zu erfinden.
> **Repos:** Frontend `/home/pmi/24pray-web` (Next 14 App Router, TS, Tailwind 3.4, Zustand 4.5, Zod 3.23 — beide letzten ungenutzt). Backend `/home/pmi/24pray-api` (Fastify 4.28, Prisma 5.18, SQLite, Zod 3.23).

---

## 1. Kontext, Scope, Non-Scope

### 1.1 Ausgangslage (verifiziert am Code, 2026-07-06)

**Frontend** hat **keine** Komponenten-Schicht: kein `src/components/`, kein `ui/`, kein `slots/`. Jede der 8 Seiten ist ein selbst-enthaltenes `page.tsx` mit inline-JSX. `globals.css` definiert nur 6 Light-Tokens (`--bg --surface --text --text-muted --accent --accent-soft`) und importiert Google Fonts extern. `tailwind.config.ts` hat eine `brand`-Hex-Skala (50–900) **unverbunden** zu den CSS-Variablen, `darkMode` ist ungesetzt. Landing/Login/Verify nutzen die Brand-Sprache; Dashboard/Projects/New/Join nutzen rohes `bg-blue-600`/`text-gray-600`/`border`. Kein Dark-Mode, keine Motion, Emojis als Icons. `zustand` + `zod` sind installiert, aber nirgends verwendet. Auth läuft rein über httpOnly-Cookies (`credentials:'include'`), kein Client-Token.

**Backend** — reale Modelle (`prisma/schema.prisma`): `User`, `PrayerProject`, `PrayerSlot`, `MagicToken`, `Session`. **Es gibt kein `Membership`-Model, kein `guestToken`, kein `slotDurationMinutes`, kein `isMine`/`slotId` in der Grid-Response.** `SlotView` (in `src/lib/slotGrid.ts`) ist rein zeitlich berechnet:

```ts
// src/lib/slotGrid.ts (IST)
export interface SlotView { startTime: string; endTime: string; status: 'FREE' | 'BOOKED'; userName: string | null; }
```

Slot-Dauer ist **1h, dreifach hartkodiert**: `slotGrid.ts:14` (`SLOT_MS`), `slots.ts:44` (`endTime`-Berechnung), `projectView.ts:32` (`totalSlots`).

**Korrektur zur Vision:** Die Vision (§0, §7) nennt „2 dokumentierte Bugs". Faktisch sind diese **nirgends im Repo als Bug vermerkt** — weder Verify-StrictMode-Doppel-Consume noch CORS-`APP_URL`-Kopplung. Der *Code-Mechanismus* beider ist aber real und belegt (§6.4/§6.5 dieser Spec). Diese Spec benennt sie erstmalig formell als zu behebende Bugs. Der `inviteToken`-Leak, den die Vision §0 andeutet, ist im Backend bereits gefixt (Commit `b073b7a`, `projectView.ts:46` gibt `inviteToken` nur an den Organizer).

### 1.2 Scope

Diese Spec liefert die Bau-Anleitung für **alle drei Wellen** der Vision §6:

- **Welle 1 (Foundation):** Token-System Light+Dark, Tailwind-Mapping, `next/font`-Self-Hosting, Lucide, Wortmarke, Primitives (`ui/`), AppShell+ThemeToggle, `lib/time.ts`, `t()`-Katalog, Altlast-Screens auf Tokens, Verify-Bugfix, CORS-Entkopplung. **Detailliertester Milestone.**
- **Welle 2 (Kern-Politur):** Slot-Modul (`slots/`) komplett, ChainProgress, Dashboard-Neubau, InviteCard, Join-/Gast-Flow, Projekt-anlegen-Zweischritt. API-Erweiterung `slotId`/`isMine`/`slotDurationMinutes`/`guestToken`.
- **Welle 3 (Ausbau):** Motion-Feinschliff, Dark-QA, Statistik-/Anliegen-Tabs, Recurring/Reminder, i18n en, PWA, `Membership`-Model, White-Label.

### 1.3 Non-Scope (bewusst ausgeklammert)

- Kein Backend-Rewrite; nur additive Migrationen + 2 Bugfixes.
- Keine neue Auth-Architektur (Cookie-Session bleibt).
- Kein Telegram-Versand-Runner (Modell-Feld existiert, Job ist Welle-3-optional).
- Kein `/projects`-Index-Screen (Home verlinkt heute ins Leere auf `/projects` — Fix = Link auf `/dashboard` umbiegen, siehe Welle 1).

---

## 2. Aufgelöste Entscheidungen (Vision §7)

Die 6 offenen Punkte, je mit Entscheidung + Begründung. Fables Default wird übernommen wo vorhanden.

### E1 — Display-Font: **Fraunces** (self-hosted via `next/font/google`)
**Entscheidung:** Fraunces (variable, `opsz` + `SOFT`≈50 + `wght`), self-hosted. Playfair entfällt.
**Begründung:** Vision-Empfehlung; variable optische Achse gibt eine wärmere, weniger „Hochzeitseinladung"-hafte Display-Stimme. Entscheidungskriterium der Vision war die Ziffern-Qualität im `ChainProgress` — Fraunces rendert tabellarische Ziffern über `font-feature-settings: "tnum"` sauber, die großen Fortschrittszahlen (`„31 von 48"`) stehen ruhig. OFL wie Playfair → kein Lizenzunterschied. `next/font/google` lädt Fraunces zur Build-Zeit self-hosted (löst zugleich den externen Google-Fonts-Import in `globals.css` → Latenz + Datenschutz).

### E2 — Theme-Lib: **`next-themes`**
**Entscheidung:** `next-themes` mit `attribute="data-theme"`, `defaultTheme="system"`, `enableSystem`.
**Begründung:** Das FOUC-Problem im App Router ist der eigentliche Kostenpunkt eines Eigenbaus; `next-themes` injiziert ein blocking-Inline-Script vor Hydration und setzt das Attribut synchron auf `<html>`, exakt das `data-theme`-Schema aus Vision §2.1. ~1 KB, aktiv gepflegt, spart den fehleranfälligen Eigenbau. Der `ThemeProvider` wird in einer Client-Boundary (`app/providers.tsx`) um `children` gelegt; `<html suppressHydrationWarning>` in `layout.tsx`.

### E3 — Optimistic Booking für Gäste: **Nein**
**Entscheidung:** Gast-Buchung läuft ausschließlich über das `GuestBookingForm`-Sheet (nicht optimistic). Optimistic-Update + Undo-Toast gilt **nur** für eingeloggte User (Vision §3.3, Fixpunkt 2).
**Begründung:** Vision-Empfehlung. Das Formular ist ohnehin ein bewusster Schritt (Name + E-Mail Pflicht); ein optimistischer Vorgriff würde den Bestätigungs-State mit `.ics`-Download und Account-Angebot zerreißen. Der Gast bekommt einen echten Erfolgs-State, kein Rückgängig.

### E4 — ChainBand-Interaktivität Desktop: **Scroll-Navigation + Hover-Tooltip (≥lg), keine Direktbuchung**
**Entscheidung:** ChainBand ist auf allen Breakpoints Heatmap + Navigation: Klick/Tap auf eine Zelle scrollt (smooth) zur zugehörigen `SlotRow` in der Liste. Ab `lg` zusätzlich ein read-only Hover-Tooltip (Zeit + Zustand + ggf. Name). **Keine** Buchung direkt aus dem Band.
**Begründung:** Vision-Empfehlung + Fixpunkt 4 (Band ist kein Buchungs-Target). Der Tooltip ist reine Progressive Enhancement für Maus-Nutzer und ändert das mentale Modell nicht — die Handlung bleibt in der Liste, wo Touch-Targets ≥44px garantiert sind.

### E5 — Namen-Sichtbarkeit: **Default „Vorname + Initial für nicht-eingeloggte Betrachter", voller Name für Projektteilnehmer — ✅ USER-BESTÄTIGT (2026-07-06)**
**Entscheidung (vom User bestätigt 2026-07-06):**
- Eingeloggte Projektteilnehmer (Organizer + wer einen Slot hält) sehen **Klarnamen** aller Betenden (heutiges Verhalten).
- Nicht-eingeloggte Betrachter (öffentlicher Invite-Link, Gast-Modus) sehen **nur Vorname + Nachname-Initial** (z. B. „Ruth K.").
- Umsetzung serverseitig: die Grid-Route maskiert `userName`, wenn `req.user` fehlt (nie clientseitig maskieren — sonst leakt der volle Name im Netzwerk-Payload).

**Begründung:** Balance zwischen dem Domain-Wert „Gemeinschaft sichtbar machen" (Vision §1) und Datenschutz auf öffentlich teilbaren Links. Volle Namen an anonyme Web-Besucher zu geben ist eine echte Produkt-/Datenschutz-Entscheidung, keine reine Design-Frage.
**→ Vom User am 2026-07-06 bestätigt** (Opus-Default übernommen): Klarnamen nur für eingeloggte Projektteilnehmer, serverseitige Maskierung auf „Vorname + Initial" für anonyme Betrachter öffentlicher Invite-Links. Ein späteres Umschalten bleibt eine Einzeiler-Änderung in der Masking-Funktion.

### E6 — Datenmodell-Migrationsreihenfolge & Membership-Timing: **Membership erst Welle 3**
**Entscheidung:**
- **Welle 2** Migrationen (additiv, nicht-brechend): `PrayerProject.slotDurationMinutes Int @default(60)`; `PrayerSlot.guestToken String? @unique`. `slotId`/`isMine` sind **keine** Migration — reine Response-Shape-Änderung der Grid-Route.
- **Welle 3** Migrationen: `Membership`, `RecurringCommitment`, `ReminderPreference`, `PrayerRequest`; COMPLETED-Completion-Job.

**Begründung:** `isMine` benötigt **kein** Membership-Model — es leitet sich rein aus `slot.userId === req.user?.id` ab. Membership löst das Problem „Mitglied *ohne* Buchung" (für Feed/Notifs) und gehört damit fachlich zu den Welle-3-Features. Es in Welle 2 zu ziehen wäre spekulativ (YAGNI) und würde die Authz-Logik (heute: Organizer-OR-PUBLIC) vorzeitig umbauen. `slotDurationMinutes` und `guestToken` dagegen sind für Welle-2-UX (Dauer-Presets, Gast-Storno) zwingend und kommen daher in Welle 2.

---

## 3. Token-Referenz (finale `globals.css` + Tailwind-Mapping)

Übernommen aus Vision §1.1 / §2.1. **Fixpunkt 1:** Hue bleibt; nur Helligkeit darf für WCAG-AA nachjustiert werden (Verifikations-Task in Welle 1, §7.1). Alle Farben leben als **HSL-Triple ohne `hsl()`-Wrapper** in Custom Properties, damit Tailwind `hsl(var(--x) / <alpha-value>)` bilden kann.

### 3.1 `src/app/globals.css` (Ziel-Struktur)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* ---- Farbe: Light „Morgenlicht auf Papier" (HSL-Triple) ---- */
  --bg: 40 33% 97%;
  --surface: 0 0% 100%;
  --surface-sunken: 40 25% 94%;
  --border: 38 18% 87%;
  --ink: 35 20% 10%;
  --ink-muted: 35 8% 40%;
  --accent: 32 72% 38%;
  --accent-strong: 32 74% 30%;
  --accent-soft: 36 64% 92%;
  --gold: 40 85% 55%;
  --night: 250 22% 42%;
  --positive: 150 40% 30%;
  --danger: 12 62% 42%;
  --focus: 32 72% 38%;

  /* ---- Komponenten-Tokens (zweite Ebene, White-Label-Hebel §5) ---- */
  --slot-free-bg: var(--surface);
  --slot-booked-bg: var(--accent);          /* via Alpha genutzt */
  --slot-mine-bg: var(--accent-soft);
  --slot-night-overlay: var(--night);       /* nur als Alpha-Overlay 4–10% */
  --chain-gap-color: var(--gold);

  /* ---- Typo ---- */
  --font-display: var(--font-fraunces);     /* next/font CSS-Var */
  --font-sans: var(--font-dm-sans);
  --text-xs: 0.75rem;   --lh-xs: 1rem;
  --text-sm: 0.875rem;  --lh-sm: 1.25rem;
  --text-base: 1rem;    --lh-base: 1.5rem;
  --text-lg: 1.25rem;   --lh-lg: 1.75rem;
  --text-xl: 1.5625rem; --lh-xl: 2rem;
  --text-2xl: 1.953rem; --lh-2xl: 2.25rem;
  --text-3xl: 2.441rem; --lh-3xl: 2.75rem;

  /* ---- Radius ---- */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  /* ---- Elevation (warm getönt) ---- */
  --shadow-1: 0 1px 2px hsl(35 30% 10% / 0.05);
  --shadow-2: 0 2px 8px hsl(35 30% 10% / 0.08);
  --shadow-3: 0 8px 32px hsl(35 30% 10% / 0.14);

  /* ---- Motion ---- */
  --dur-fast: 150ms;
  --dur-mid: 250ms;
  --dur-slow: 400ms;
  --ease-enter: cubic-bezier(0.2, 0, 0, 1);
  --ease-exit: ease-in;
}

/* Dark „Nachtwache" — warmes Anthrazit. Nur Farb-Tokens werden überschrieben. */
[data-theme="dark"] {
  --bg: 30 12% 8%;
  --surface: 30 12% 12%;
  --surface-sunken: 30 12% 10%;
  --border: 32 10% 22%;
  --ink: 38 28% 92%;
  --ink-muted: 36 10% 62%;
  --accent: 36 78% 60%;
  --accent-strong: 36 82% 68%;
  --accent-soft: 34 40% 18%;
  --gold: 42 90% 62%;
  --night: 250 26% 60%;
  --positive: 150 35% 55%;
  --danger: 12 70% 62%;
  --focus: 36 78% 60%;
  /* Dark: Elevation über Border, Schatten fast unsichtbar */
  --shadow-1: 0 1px 2px hsl(0 0% 0% / 0.2);
  --shadow-2: 0 2px 8px hsl(0 0% 0% / 0.28);
  --shadow-3: 0 8px 32px hsl(0 0% 0% / 0.4);
}

/* System-Default, wenn kein expliziter Theme-Wunsch gesetzt ist.
   next-themes stempelt data-theme; dieser Block ist Fallback vor Hydration. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* identisch zu [data-theme="dark"] — via CSS-Nesting oder Duplikat.
       Praktisch: next-themes setzt data-theme synchron, dieser Block deckt
       nur das Millisekunden-Fenster / no-JS ab. Duplikat der Dark-Tokens. */
  }
}

@layer base {
  * { border-color: hsl(var(--border)); }
  body {
    background-color: hsl(var(--bg));
    color: hsl(var(--ink));
    font-family: var(--font-sans), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "cv11";      /* DM Sans lesbare Ziffern */
  }
  .tnum { font-variant-numeric: tabular-nums; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

> **Hinweis Dark-Fallback:** Der `@media`-Block muss die Dark-Tokens duplizieren (CSS erlaubt kein `@apply` von Selektor-Blöcken). Alternativ CSS-Nesting mit PostCSS. In der Praxis ist er nur für das Vor-Hydration-Fenster / JS-off relevant, weil `next-themes` `data-theme` synchron setzt.

### 3.2 `tailwind.config.ts` (Ziel)

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],   // an next-themes-Attribut gekoppelt
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          sunken: 'hsl(var(--surface-sunken) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          muted: 'hsl(var(--ink-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          strong: 'hsl(var(--accent-strong) / <alpha-value>)',
          soft: 'hsl(var(--accent-soft) / <alpha-value>)',
        },
        gold: 'hsl(var(--gold) / <alpha-value>)',
        night: 'hsl(var(--night) / <alpha-value>)',
        positive: 'hsl(var(--positive) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        // brand-Hex-Skala bleibt als Referenz, wird im JSX NICHT verwendet:
        brand: { /* 50..900 wie bisher */ },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Playfair Display', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['var(--text-xs)', 'var(--lh-xs)'],
        sm: ['var(--text-sm)', 'var(--lh-sm)'],
        base: ['var(--text-base)', 'var(--lh-base)'],
        lg: ['var(--text-lg)', 'var(--lh-lg)'],
        xl: ['var(--text-xl)', 'var(--lh-xl)'],
        '2xl': ['var(--text-2xl)', 'var(--lh-2xl)'],
        '3xl': ['var(--text-3xl)', 'var(--lh-3xl)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)', md: 'var(--radius-md)',
        lg: 'var(--radius-lg)', full: 'var(--radius-full)',
      },
      boxShadow: { 1: 'var(--shadow-1)', 2: 'var(--shadow-2)', 3: 'var(--shadow-3)' },
      gridTemplateColumns: { 24: 'repeat(24, minmax(0, 1fr))' },   // ChainBand
      transitionTimingFunction: {
        enter: 'var(--ease-enter)', exit: 'var(--ease-exit)',
      },
      keyframes: {
        breathe: { '0%,100%': { opacity: '0.65', transform: 'scale(1)' },
                   '50%': { opacity: '1', transform: 'scale(1.03)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' },
                 '25%': { transform: 'translateX(-4px)' },
                 '75%': { transform: 'translateX(4px)' } },
      },
      animation: {
        breathe: 'breathe 4s ease-in-out infinite',
        shake: 'shake 150ms ease-in-out 1',
      },
    },
  },
  plugins: [],
};
export default config;
```

**Regel (Fixpunkt 1 + Vision §2.1):** `blue-600`/`gray-*`/`red-600` und `bg-[var(--x)]`-Arbitrary-Values sind im App-Code **verboten**. Nur semantische Utilities (`bg-surface`, `text-ink-muted`, `border-border`, `bg-accent`, `text-danger`). Durchsetzung: ESLint-Regel `no-restricted-syntax` gegen die Roh-Paletten-Klassen (Welle 1, §6.1) plus Review-Konvention.

### 3.3 WCAG-Nachjustierung (Fixpunkt 1)
Die HSL-Werte werden zunächst **1:1 aus der Vision übernommen**. Welle 1 enthält einen Verifikations-Task (§7.1), der jede Text/Fläche-Paarung gegen AA prüft. Falls eine Paarung reißt, wird **nur die L-Komponente** angepasst und **hier dokumentiert** (Hue/Sat bleiben). Bekannte Kandidaten zum Prüfen: `--accent` (#A6621B) als Fill mit weißem Text (Vision behauptet ≥4.5:1 — verifizieren), `--ink-muted` auf `--bg`, Dark `--accent` (heller Fill) mit dunklem Text `--bg`.

---

## 4. Komponenten-Contracts

Verzeichnisstruktur (Vision §2.2), Screens enthalten danach nur Datenbeschaffung + Komposition:

```
src/components/
├─ ui/        Primitives (dumm, Props+Tokens, cva-Varianten)
├─ patterns/  Domänen-Muster (komponieren Primitives)
└─ slots/     Slot-Modul (Herzstück, §3 Vision)
```

Utility-Basis: `clsx` + `tailwind-merge` in `cn()` (existiert bereits in `lib/utils.ts`), `class-variance-authority` (`cva`) für Varianten, `lucide-react` für Icons.

### 4.1 `ui/` Primitives

```ts
// ui/Button.tsx
import { type VariantProps } from 'class-variance-authority';
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
          VariantProps<typeof buttonVariants> {
  loading?: boolean;         // zeigt Spinner, disabled währenddessen
  icon?: LucideIcon;         // optional führendes Icon (20px)
  asChild?: boolean;         // Slot-Pattern für <Link>-Wrapping
}
// variant: 'primary' | 'secondary' | 'ghost' | 'danger'
// size:    'sm' | 'md' | 'lg'
// primary=bg-accent text-bg hover:bg-accent-strong; secondary=bg-surface-sunken;
// ghost=transparent hover:bg-surface-sunken; danger=text-danger (ghost) / bg-danger (fill)
// Alle: rounded-md, focus-visible:ring-2 ring-[hsl(var(--focus))] ring-offset-2, min-h 44px @ md
```

```ts
// ui/Input.tsx, ui/Textarea.tsx, ui/Select.tsx
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;         // roter Border via --danger
}
// bg-surface, border-border, rounded-sm, focus-visible:ring-2, invalid:border-danger

// ui/Label.tsx — <label> text-sm text-ink-muted, htmlFor Pflicht
// ui/FieldError.tsx — { children }: text-sm text-danger role="alert", nur wenn Fehler
```

```ts
// ui/Card.tsx
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2 | 3;     // default 1
  as?: React.ElementType;    // 'div' | 'section' | 'article'
}
// bg-surface, border-border, rounded-lg, shadow-{elevation}, p-5/p-6

// ui/Badge.tsx — variant: 'neutral'|'accent'|'positive'|'danger'|'night', size sm; rounded-full
// ui/Avatar.tsx
export interface AvatarProps {
  name: string | null;       // Initialen-Fallback (max 2 Buchstaben, aus name)
  size?: 'sm' | 'md';        // 28 / 36px
  variant?: 'default' | 'mine';   // mine = accent-soft bg + accent ring
}
// KEIN Bild-Support v1 (Domäne hat keine Avatare); reine Initialen auf accent-soft.

// ui/Divider.tsx — <hr> border-border
```

```ts
// ui/Sheet.tsx — Bottom-Sheet (<md) / zentrierter Dialog (≥md). Radix Dialog als Basis.
export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;            // Sheet-Titel (text-xl display-font)
  children: React.ReactNode;
  side?: 'bottom' | 'center';   // default responsive: bottom<md, center≥md
}
// Enter 400ms ease-enter (Slide-up mobil / Fade+Scale Desktop), Exit ease-exit.
// Fokus-Falle, ESC schließt, Backdrop hsl(35 30% 10% / 0.4), rounded-lg oben.
// reduced-motion: nur Opacity.

// ui/Toast.tsx + ui/toast-store.ts (Zustand!)
export interface ToastOptions {
  message: string;
  variant?: 'default' | 'positive' | 'danger';
  action?: { label: string; onClick: () => void };   // Undo-Button
  durationMs?: number;       // default 6000 (Undo-Fenster)
}
// Zustand-Store `useToastStore` (endlich Nutzung der installierten Dep):
//   push(opts) => id; dismiss(id); Auto-Dismiss nach durationMs.
// Ein <Toaster/> in AppShell rendert die Queue (max 3, gestapelt, unten-zentriert).

// ui/Tooltip.tsx — Radix Tooltip, nur Pointer (kein Touch), delay 300ms.
// ui/Spinner.tsx — {size}: Lucide `loader-2` animate-spin (reduced-motion: statisch).
// ui/Skeleton.tsx — {className}: bg-surface-sunken animate-pulse rounded (pulse off @ reduced-motion).
// ui/Progress.tsx — {value, max, segmented?}: linearer Balken ODER segmentiert (ChainProgress nutzt segmented).
```

```ts
// ui/EmptyState.tsx
export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string };
}
// zentriert, icon 32px text-ink-muted, title display-font text-xl.

// ui/Tabs.tsx — Radix Tabs.
export interface TabsProps {
  tabs: { id: string; label: string; disabled?: boolean }[];
  value: string;
  onValueChange: (id: string) => void;
  children: React.ReactNode;   // TabPanels
}
// Projekt-Detail: „Kette" aktiv, „Anliegen"/„Statistik" disabled bis Welle 3.
```

### 4.2 `patterns/`

```ts
// patterns/AppShell.tsx — { children }
//   TopBar: <Brand/> (Wortmarke SVG links) · <ThemeToggle/> · <UserMenu/> (Avatar, Logout)
//   schmaler Footer. max-w Container. <Toaster/> gemountet.
// patterns/Brand.tsx — SVG-Wortmarke „24pray" (Fraunces) + Flamme-im-Zifferblatt-Monogramm.
//   Props: { size?: 'sm'|'lg'; monogramOnly?: boolean }. Ersetzt 🙏 überall.
// patterns/ThemeToggle.tsx — sun/moon Lucide, useTheme() von next-themes, 3-Zustand system/light/dark.

// patterns/ProjectCard.tsx
export interface ProjectCardProps { project: ProjectWithStats; }
//   Titel (display), <ChainBandMini/> (aggregiert, nicht interaktiv), ChainProgress-Zahl,
//   Status-Badge (übersetzt via t()), nächster eigener Slot falls vorhanden. Link → /projects/:id

// patterns/NextSlotCard.tsx
export interface NextSlotCardProps {
  slot: { projectId: string; projectTitle: string; startTime: string; endTime: string };
  projectTimezone: string;
}
//   „Heute, 21–22 Uhr · Gebetskette für Lena" + Countdown ab T−1h (flame-Icon).

// patterns/InviteCard.tsx (nur Organizer)
export interface InviteCardProps { inviteUrl: string; }   // aus inviteToken gebaut
//   Link (read-only Input) + Copy-Button (Toast „Link kopiert") + optional QR (Welle 3).

// patterns/TimezoneHint.tsx
export interface TimezoneHintProps { projectTimezone: string; }
//   Rendert NUR wenn projectTimezone !== Intl…resolvedOptions().timeZone.
//   Badge (moon/globe Icon): „Zeiten in Europe/Berlin".
```

### 4.3 `slots/` — Herzstück (Vision §3, verbindlich)

#### Zustands-Typ (Client, abgeleitet aus `SlotView` + Zeit)

```ts
// slots/types.ts
export type SlotCellState =
  | 'FREE' | 'FREE_LARGEST_GAP'
  | 'BOOKED' | 'MINE'
  | 'PAST' | 'NOW_FREE' | 'NOW_MINE' | 'NOW_BOOKED'
  | 'PENDING' | 'CONFLICT';

export interface SlotViewModel {
  slotId: string | null;        // API: null wenn FREE
  startTime: string;            // ISO, aus API
  endTime: string;
  isMine: boolean;              // API
  userName: string | null;      // API (ggf. serverseitig maskiert, §E5)
  isNight: boolean;             // 22–06 Projekt-TZ, client-berechnet via lib/time
  isLargestGap: boolean;        // client: Teil der größten zusammenhängenden Lücke
  state: SlotCellState;         // abgeleitet (deriveSlotState)
}
// deriveSlotState(view, now, projectTz, isLargestGap, pendingIds, conflictId) => SlotCellState
```

#### Zustands-Matrix (Vision §3.2 — verbindlich)

| State | Fläche | Kennzeichnung | Interaktion |
|---|---|---|---|
| `FREE` | `bg-surface`, gestrichelte 1px-Border | „Noch offen" (ink-muted) | Row-Klick/Button → Buchen |
| `FREE_LARGEST_GAP` | + schwacher `--gold`-Tint | Micro-Label „Schließt die größte Lücke" | wie FREE |
| `BOOKED` (fremd) | `bg-surface-sunken` | Avatar + Name | Klick → SlotSheet (Info-only) |
| `MINE` | `bg-accent-soft`, ganze Zeile getönt | Avatar + „Du" + Ring | Klick → SlotSheet (Stornieren) |
| `PAST` | opacity 40 %, keine Aktion | — | Tag default eingeklappt |
| `NOW_*` | Grundzustand + linke 3px-Gold-Kante | atmender Flame-Dot + Kontexttext | NOW_FREE bucht laufende Stunde sofort |
| `PENDING` | Zielzustand @ opacity 60 % | Mini-Spinner im Button | — |
| `CONFLICT` | rollt zurück | Shake + Toast „… hat gerade X übernommen" | Liste refresht |

#### Contracts

```ts
// slots/ChainBand.tsx  (Vision §3.1 — 24 Zellen/Tag, Heatmap + Navigation)
export interface ChainBandProps {
  days: { date: string; cells: SlotViewModel[] }[];   // je Tag 24 Zellen
  onCellActivate: (slotStartTime: string) => void;    // scrollt zur SlotRow
  interactiveTooltip?: boolean;                        // ≥lg (E4), read-only
}
// grid-cols-24, Zelle h-10..12px rounded-[3px] gap-[2px]. Farbe je state (Alpha).
// Nacht-Zeilen: --night-Overlay + 12px moon-Glyph am Zeilenanfang. Jetzt: gold-Dot animate-breathe.
// KEINE Buchung aus dem Band (Fixpunkt 4). Klick → onCellActivate → smooth scroll + Zell-Puls.

// slots/SlotList.tsx
export interface SlotListProps {
  project: ProjectWithStats;
  slots: SlotViewModel[];
  onBook: (slot: SlotViewModel) => void;     // eingeloggt: optimistic; Gast: öffnet GuestForm
  onOpenSheet: (slot: SlotViewModel) => void;
  currentUserId: string | null;              // null = Gast-Modus
}
// gruppiert nach Projekttag → DaySection[]; PAST-Tage collapsed.

// slots/DaySection.tsx
export interface DaySectionProps {
  dateLabel: string;                 // „Montag, 6. Juli" (lib/time, Projekt-TZ)
  dayProgress: { booked: number; total: number };   // Sticky-Header „14/24"
  slots: SlotViewModel[];
  defaultCollapsed?: boolean;        // PAST-Tage
  children: (slot: SlotViewModel) => React.ReactNode;   // SlotRow-Renderer
}
// Sticky-Header (position: sticky, top: TopBar-Höhe).

// slots/SlotRow.tsx  (Höhe 52px, Touch ≥44px)
export interface SlotRowProps {
  slot: SlotViewModel;
  onBook: () => void;
  onOpen: () => void;
}
// Links: „02–03" tabular (Projekt-TZ) + moon bei Nacht.
// Mitte: FREE „Noch offen" | BOOKED Avatar+Name | MINE Avatar+„Du".
// Rechts: FREE „Übernehmen" (secondary→primary on hover/focus) | MINE nichts (Storno nur im Sheet) | fremd nichts.
// NOW: linke 3px gold-Kante + Flame-Dot. reduced-motion: Dot statisch.

// slots/NowMarker.tsx — {} : atmender Flame-Dot (animate-breathe), zwischen den Rows der laufenden Stunde.

// slots/SlotSheet.tsx  (Vision §3.3 — Info / Buchen-Rekap / Stornieren)
export interface SlotSheetProps {
  open: boolean; onOpenChange: (o: boolean) => void;
  slot: SlotViewModel | null;
  project: ProjectWithStats;
  mode: 'info' | 'mine' | 'guest-book';   // info=fremd, mine=Storno, guest-book=GuestForm
  onCancel?: () => Promise<void>;         // Storno (mode='mine'), mit Rückfrage
  onGuestBooked?: (slotId: string, guestToken: string) => void;
}
// beide Zeitzonen (TimezoneHint), Nacht → „Nachtwache"-Micro-Label.
// mode='mine': CTA „Stunde freigeben" (danger-ghost) + Rückfrage-Confirm.
// Andockpunkt Welle 3: „Jede Woche übernehmen", „Erinnere mich".

// slots/GuestBookingForm.tsx  (Vision §3.3 — der sorgfältigste Pfad)
export interface GuestBookingFormProps {
  slot: SlotViewModel;
  project: ProjectWithStats;
  onSubmit: (data: { guestName: string; guestEmail: string }) => Promise<{ guestToken: string }>;
}
// Rekap (beide TZ) → Name (Pflicht) + E-Mail (Pflicht, „für deine Erinnerung") → CTA „Diese Stunde übernehmen".
// Erfolg: Bestätigungs-State im Sheet + .ics-Download („In Kalender eintragen") + dezentes Account-Angebot.
// KEIN optimistic (E3). Zod-Schema clientseitig (endlich Nutzung der Dep).

// slots/ChainProgress.tsx  (Vision §3.4 — Kopf des Projekt-Details)
export interface ChainProgressProps {
  booked: number; total: number;
  largestGap?: { label: string; startTime: string };   // „Di 03–06 Uhr"
  onGapClick?: (startTime: string) => void;             // scrollt + Zellen pulsieren
  cells: SlotViewModel[];                               // aggregiertes Band
}
// Primärzahl display-font „31 von 48 Stunden gehalten" + segmentiertes Band (= ChainBand aggregiert).
// 100%: Band durchgehend gold, „Die Kette ist geschlossen." (statisch).
```

#### Buchungs-Flow (Vision §3.3 — verbindlich)

- **Eingeloggt:** Klick → **optimistic** State-Update (Zustand-Store `useSlotGridStore`, endlich Nutzung der Dep) → `POST /projects/:id/slots` → Undo-Toast (6 s, `action.onClick` → `DELETE /slots/:id`). Bei **409**: Rollback + `CONFLICT` (Shake + Toast mit Namen des Gewinners) + Grid-Refetch.
- **Gast:** Klick → `SlotSheet mode='guest-book'` → `GuestBookingForm` → `POST` (ohne Session) → Erfolg-State + `.ics`. Kein optimistic (E3). Server gibt `guestToken` zurück (§6.3), im `localStorage` (`24pray:guest:<slotId>`) für späteres Selbst-Storno.
- **Storno:** nur im `SlotSheet` (nie Row-Button). Eingeloggt: `DELETE /slots/:id`. Gast: `DELETE /slots/:id?guestToken=…` (§6.3).

---

## 5. Zeit-Layer: `src/lib/time.ts` (neu, zentral)

Alle Datums-/Zeitformatierung läuft hierüber (Vision §3.5, Fixpunkt 3). **Verbot** von rohem `toLocaleString()`/`new Date().toLocale…` im App-Code.

```ts
// lib/time.ts
export function formatSlotRange(startISO: string, endISO: string, projectTz: string): string; // „02–03"
export function formatDayHeader(dateISO: string, projectTz: string): string;   // „Montag, 6. Juli"
export function isNightHour(startISO: string, projectTz: string): boolean;      // 22–06 Projekt-TZ
export function browserTz(): string;                                            // Intl…timeZone
export function formatDualTz(startISO: string, endISO: string, projectTz: string): // „03–04 · bei dir 05–06"
  { project: string; local: string; differs: boolean };
export function buildIcs(slot: { startTime: string; endTime: string; title: string }): string; // .ics-Blob
// Intern via Intl.DateTimeFormat({ timeZone }). Keine Fremd-Lib zwingend nötig;
// date-fns-tz optional erlaubt, wenn Bundle-Budget es trägt.
```

`lib/i18n.ts` wird zum echten Katalog: `t(key, params?)` mit `de` vollständig + `en`-Skeleton, alle heute hartkodierten deutschen Strings → Keys. Status-Enums (`ACTIVE`/`DRAFT`, `FREE`/`BOOKED`) bekommen Übersetzungs-Keys.

---

## 6. API-Änderungen (gegen reales Schema)

Alle additiv, nicht-brechend. Migrations via `prisma migrate dev`.

### 6.1 `SlotView` erweitern: `slotId` + `isMine` (keine Migration)

`src/lib/slotGrid.ts` — Interface + `buildSlotGrid`-Signatur:

```ts
export interface SlotView {
  slotId: string | null;        // NEU: DB-PrayerSlot.id, null wenn FREE
  startTime: string;
  endTime: string;
  status: 'FREE' | 'BOOKED';
  userName: string | null;
  isMine: boolean;              // NEU
}
interface BookedSlotInput {     // erweitern:
  id: string; userId: string | null; startTime: Date; userName: string | null; guestName: string | null;
}
export function buildSlotGrid(
  start: Date, end: Date, booked: BookedSlotInput[],
  requesterId: string | null,   // NEU
  slotDurationMinutes: number,  // NEU (§6.2)
): SlotView[];
// pro belegter Stunde: slotId = hit.id; isMine = requesterId != null && hit.userId === requesterId;
// userName = §E5-Masking (bei requesterId==null: maskName(userName ?? guestName)).
```

`src/routes/slots.ts` GET `/projects/:id/slots`: `include:{ user:true }` bleibt; `id`/`userId`/`guestName` in `BookedSlotInput` durchreichen; `req.user?.id ?? null` + `project.slotDurationMinutes` an `buildSlotGrid`. **Damit kann das Frontend `DELETE /slots/:id` aufrufen (heute unmöglich) und eigene Slots erkennen.**

Masking (§E5, serverseitig): `function maskName(n: string|null): string|null` → `"Ruth Klein"` → `"Ruth K."`. Nur angewandt wenn `requesterId === null`.

### 6.2 `slotDurationMinutes` (Migration)

`prisma/schema.prisma`:
```prisma
model PrayerProject {
  // …
  slotDurationMinutes Int @default(60)   // NEU
}
```
Migration `add_slot_duration`. Danach die **drei** hartkodierten Stellen umstellen:
- `src/lib/slotGrid.ts:14` `SLOT_MS` → Parameter `slotDurationMinutes * 60_000`.
- `src/routes/slots.ts:44` `endTime` → `startTime + project.slotDurationMinutes * 60_000`.
- `src/lib/projectView.ts:32` `slotMs` → `project.slotDurationMinutes * 60_000`.
Create-Route (`POST /projects`) akzeptiert optional `slotDurationMinutes` (Zod, default 60). UI Welle 2: Dauer-Presets im Zweischritt-Formular.

### 6.3 `guestToken` — Gast-Storno (Migration)

`prisma/schema.prisma`:
```prisma
model PrayerSlot {
  // …
  guestToken String? @unique   // NEU: Secret für Gast-Selbst-Storno
}
```
Migration `add_guest_token`.
- `POST /projects/:id/slots`: bei Gast-Buchung (`userId === null`) `guestToken = randomSecret()` minten, in Response zurückgeben (die Route gibt heute schon das rohe `PrayerSlot` zurück — Token ist damit enthalten). Für eingeloggte User bleibt `guestToken` null.
- `DELETE /slots/:id`: `requireUser` **lockern** zu optionalem Pfad:
  ```ts
  const { guestToken } = req.query;   // Zod: optional string
  const user = req.user;              // NICHT requireUser (erlaubt anon)
  const isBooker    = user && slot.userId === user.id;
  const isOrganizer = user && slot.project.organizerId === user.id;
  const isGuest     = !user && guestToken && slot.guestToken === guestToken;  // NEU
  if (!isBooker && !isOrganizer && !isGuest) return reply.code(403)…;
  ```
- **Bug-Beachtung:** `slot.userId === user.id` bei Gast-Slots ist `null === id` = false — daher braucht der Gast-Pfad zwingend den Token-Vergleich, nicht die User-Prüfung.

### 6.4 Bug-Fix 1 — Verify-StrictMode-Doppel-Consume (`src/routes/auth.ts`)

**Mechanismus (verifiziert):** `POST /auth/verify` (auth.ts:36–39) setzt `consumedAt` beim ersten Aufruf; `auth.test.ts:60–67` erzwingt 400 beim zweiten. React-18-StrictMode ruft den Verify-`useEffect` doppelt → zweiter POST → 400 „Link ungültig" trotz gültiger Session.

**Fix (Backend, idempotent — bevorzugt):** Wenn Token bereits `consumedAt` gesetzt, aber innerhalb eines kurzen Grace-Fensters (z. B. `consumedAt > now-30s`) UND eine gültige Session für denselben User existiert bzw. gerade erzeugt wurde, dann **Erfolg** statt 400 zurückgeben. Konkret: bei `record.consumedAt` prüfen ob eine noch gültige `Session` für `record.userId` existiert → 200 mit User + (Re-)Set-Cookie; sonst 400. Der `auth.test.ts`-Test wird auf dieses Verhalten angepasst (zweiter Verify innerhalb Grace = 200, nach Ablauf = 400).

**Fix (Frontend, zusätzlich, Gürtel+Hosenträger):** `auth/verify/page.tsx` — `useRef`-Guard gegen Doppel-Ausführung des `useEffect` (`if (ref.current) return; ref.current = true;`). Und: Verify-Error bekommt einen Ausweg-CTA „Neuen Link anfordern" (Vision §4, heute Sackgasse).

### 6.5 Bug-Fix 2 — CORS-`APP_URL`-Kopplung (`src/env.ts`, `src/app.ts`)

**Mechanismus (verifiziert):** `env.APP_URL` (env.ts:9, required, kein Default) ist gleichzeitig CORS-Origin (app.ts:26) **und** Magic-Link-Base (auth.ts:28). Eine zweite Frontend-Origin kann nicht CORS-erlaubt werden ohne den Magic-Link-Host zu ändern. Symptom (Vision §0): `.env` stand auf `:3002`, Frontend auf `:3000` → alle auth-Fetches „Failed to fetch".

**Fix:**
```ts
// src/env.ts — NEU, entkoppelt:
APP_URL:      z.string().url(),                              // bleibt: Magic-Link-Base
CORS_ORIGINS: z.string().default('')                         // NEU: Komma-Liste
  .transform(s => s.split(',').map(x => x.trim()).filter(Boolean)),
```
```ts
// src/app.ts — Origin-Liste, APP_URL immer erlaubt:
const origins = [env.APP_URL, ...env.CORS_ORIGINS];
await app.register(cors, { origin: origins, credentials: true });
```
`.env.example` dokumentieren: `APP_URL=http://localhost:3000` (muss = Frontend-Host für Magic-Links), `CORS_ORIGINS=` (optional zusätzliche Origins). **Doku in `docs/` + README:** APP_URL == Frontend-Origin, kein `:3002`-Mismatch.

---

## 7. Milestones (die 3 Wellen)

Legende: `- [ ]` Arbeitspaket. Jede Welle schließt mit **Akzeptanzkriterien**.

### Welle 1 — Foundation (Design-System steht) — *detailliertester Milestone*

**W1.1 Tokens + Tailwind**
- [ ] `src/app/globals.css` auf §3.1 umstellen (HSL-Triples, Dark-Block, Motion/Radius/Shadow/Typo-Tokens, reduced-motion, `.tnum`). Google-Fonts-`@import` entfernen.
- [ ] `tailwind.config.ts` auf §3.2 (semantische `colors`, `darkMode: ['selector','[data-theme="dark"]']`, `gridTemplateColumns.24`, keyframes `breathe`/`shake`, fontSize-Skala). `brand`-Skala als toter Referenz-Block belassen.
- [ ] ESLint-Regel `no-restricted-syntax` gegen `blue-*`/`gray-*`/`red-*`/`green-*`-Klassen + `bg-[var(--…)]`-Arbitrary-Values im JSX.

**W1.2 Fonts + Icons + Brand**
- [ ] `next/font/google`: Fraunces (`--font-fraunces`) + DM Sans (`--font-dm-sans`) self-hosted, Variablen in `layout.tsx` an `<html>`.
- [ ] `lucide-react` installieren; alle Emoji-Icons (🙏 ✉️ ✓ ✕) durch Lucide ersetzen.
- [ ] `patterns/Brand.tsx` — SVG-Wortmarke + Flamme-Monogramm. 🙏 raus.
- [ ] Deps: `class-variance-authority`, `tailwind-merge`, `next-themes`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`.

**W1.3 Primitives (`ui/`)** — je Komponente §4.1
- [ ] Button, Input, Textarea, Select, Label, FieldError
- [ ] Card, Badge, Avatar (Initialen), Divider
- [ ] Sheet (Radix), Toast + `useToastStore` (Zustand), Tooltip
- [ ] Skeleton, Spinner, EmptyState, Tabs, Progress

**W1.4 AppShell + Theme**
- [ ] `app/providers.tsx` (`next-themes` ThemeProvider, Client-Boundary); `layout.tsx` `<html suppressHydrationWarning>`.
- [ ] `patterns/AppShell.tsx` (TopBar: Brand · ThemeToggle · UserMenu; Footer; `<Toaster/>`).
- [ ] `patterns/ThemeToggle.tsx`.

**W1.5 Zeit + i18n**
- [ ] `src/lib/time.ts` (§5) — `formatSlotRange`, `formatDayHeader`, `isNightHour`, `browserTz`, `formatDualTz`, `buildIcs`.
- [ ] `src/lib/i18n.ts` → Katalog `t(key, params?)`, `de` vollständig, `en`-Skeleton; alle hartkodierten Strings der Altlast-Screens migrieren.

**W1.6 Altlast-Screens auf Tokens+Primitives** (kein Redesign, nur Materialisierung)
- [ ] `(public)/page.tsx` — Brand statt Emoji; CTA-Fix: `/projects` → `/dashboard`; „Kein Account nötig"-Badge.
- [ ] `auth/login/page.tsx` — Card, Lucide, Primitives.
- [ ] `auth/verify/page.tsx` — Card + Verify-Error-CTA „Neuen Link anfordern" + `useRef`-Guard (§6.4 FE-Teil).
- [ ] `dashboard/page.tsx` — Primitives, Status-Badge übersetzt, `bg-blue-600` raus.
- [ ] `projects/[id]/page.tsx` — Basis auf Primitives (Slot-Modul kommt Welle 2; hier nur Tokens).
- [ ] `projects/new/page.tsx` — Primitives (Zweischritt kommt Welle 2).
- [ ] `join/[token]/page.tsx` — Primitives (Einladungskarte kommt Welle 2).

**W1.7 Backend-Bugfixes (können parallel)**
- [ ] §6.5 CORS-Entkopplung (`env.ts`, `app.ts`, `.env.example`, README-Doku).
- [ ] §6.4 Verify-Idempotenz (Backend) + Test-Anpassung.

**Akzeptanzkriterien Welle 1:**
- Kein `blue-*`/`gray-*`/`red-*`/`green-*` und kein `bg-[var(--…)]` mehr im `src/app/**`-JSX (ESLint grün).
- Theme-Toggle schaltet alle 7 Screens Light↔Dark ohne FOUC (Hard-Reload im Dark-System-Setting zeigt sofort Dark).
- Keine Emojis mehr als UI-Icon (`grep` nach Emoji in `src/` leer).
- Kein externer Font-Request im Network-Tab (self-hosted).
- Verify funktioniert unter Dev-StrictMode (Doppel-POST → weiterhin Login-Erfolg, kein „Link ungültig").
- Auth-Fetches vom Frontend-Host (`:3000`) gegen API erfolgreich (CORS grün).
- `prefers-reduced-motion` schaltet alle Transitions/Loops ab.

### Welle 2 — Kern-Politur (das Herzstück wird das Herzstück)

**W2.1 API-Erweiterungen (zuerst — FE hängt daran)**
- [ ] §6.1 `SlotView` um `slotId` + `isMine`; `buildSlotGrid`-Signatur + GET-Route; `maskName` (§E5-Default).
- [ ] §6.2 Migration `slotDurationMinutes` + 3 hartkodierte Stellen umziehen; `POST /projects` akzeptiert Feld.
- [ ] §6.3 Migration `guestToken`; Mint bei Gast-Buchung; `DELETE /slots/:id` Token-Pfad.
- [ ] Frontend `src/types/index.ts` `SlotView` angleichen; `src/lib/api.ts` — konkrete `bookSlot`/`cancelSlot`-Helper (statt inline).

**W2.2 Slot-Modul (`slots/`, §4.3)**
- [ ] `slots/types.ts` + `deriveSlotState` (Zustands-Matrix §3.2) + Unit-Tests der Ableitung.
- [ ] `useSlotGridStore` (Zustand): Slots, pendingIds, conflictId, optimistic book/cancel/rollback.
- [ ] ChainBand, SlotList, DaySection, SlotRow, NowMarker.
- [ ] SlotSheet (info/mine/guest-book) + Storno-Rückfrage.
- [ ] GuestBookingForm (Zod-Validierung, .ics-Download, Account-Angebot) — E3: kein optimistic.
- [ ] Optimistic Booking + Undo-Toast (eingeloggt) + 409-Conflict-Handling (Shake + Refetch).
- [ ] „größte Lücke"-Berechnung (client) + `FREE_LARGEST_GAP`-Tint.

**W2.3 ChainProgress + Leerzustände**
- [ ] `slots/ChainProgress.tsx` (§3.4) + „größte Lücke"-Link → Scroll+Puls.
- [ ] Leerzustände §3.6 (0 Buchungen, DRAFT-Banner, vorbei=Rückschau).

**W2.4 Screens neu (Komposition)**
- [ ] `dashboard/page.tsx` — NextSlotCard(s) oben, ProjectCards mit Mini-ChainBand + Fortschritt + EmptyState.
- [ ] `projects/[id]/page.tsx` — Header + ChainProgress + InviteCard (nur Organizer) + ChainBand + SlotList; Tabs-Container („Kette" aktiv, andere disabled); TimezoneHint; eigener nächster Slot als Pin.
- [ ] `projects/new/page.tsx` — Zweischritt: (1) Titel+Anlass, (2) Start + **Dauer-Presets** (24/48/72h/1 Woche/eigen) + Sichtbarkeit-Radio-Cards + Live-Zusammenfassung → Redirect mit offener InviteCard.
- [ ] `join/[token]/page.tsx` — Einladungskarte („Miriam lädt dich ein"), ChainProgress, Gast-Modus-Buchung via GuestBookingForm; „Anmelden" nur Sekundärlink.

**Akzeptanzkriterien Welle 2:**
- Alle 7 Zustände der Matrix §3.2 auf dem Grid sichtbar/korrekt (Seed mit MINE/BOOKED/FREE/PAST/NOW).
- Eingeloggt: Klick bucht optimistisch, Undo-Toast macht rückgängig (`DELETE`), 409 rollt zurück + Shake.
- Gast (kein Cookie): Buchung nur via Formular-Sheet, Erfolg → `.ics`-Download + `guestToken` in localStorage; Gast kann eigenen Slot per Token stornieren.
- Zeiten überall in Projekt-TZ (`HH–HH` tabular), TimezoneHint bei Abweichung; kein `toLocaleString` mehr in `src/app/**`.
- Storno nur aus dem Sheet erreichbar (kein Row-Button).
- InviteCard zeigt kopierbaren Link (nur Organizer); Projekt-anlegen endet mit offener InviteCard.
- `slotDurationMinutes` steuert Grid-Schrittweite (Projekt mit 60 min → 24 Zellen/Tag).

### Welle 3 — Ausbau (Wachstum ohne Umbau)

**W3.1 Motion + Dark-QA**
- [ ] Ketten-Glow beim Lücken-Schließen (Verbindungssteg `--gold` 400ms), Landing-Band-Animation (24 Zellen, ~20 s Loop, reduced-motion-safe).
- [ ] Dark-Mode-QA auf allen Screens (Kontrast, Elevation-über-Border).

**W3.2 Datenmodell + Features**
- [ ] Migration `Membership` (userId, projectId, role, `@@unique([userId, projectId])`) + Authz-Anpassung.
- [ ] `SlotStatus.COMPLETED`-Completion-Job (Slot vorbei → COMPLETED) → Statistik-Tab.
- [ ] `RecurringCommitment` + SlotSheet-Toggle „Jede Woche"; Grid-Merge serverseitig.
- [ ] `ReminderPreference` (E-Mail zuerst; Telegram existiert im Modell) + Job-Runner.
- [ ] `PrayerRequest` (Anliegen-Feed-Tab, auch für Gäste).
- [ ] Tabs aktivieren („Anliegen", „Statistik").

**W3.3 Reichweite**
- [ ] i18n `en` vollständig.
- [ ] PWA-Manifest + Installierbarkeit + Icons.
- [ ] White-Label: `Brand`-Komponente austauschbar, Theme = Token-Satz via `data-theme`, Slot-Farb-Tokens (§3.1 zweite Ebene) pro Instanz überschreibbar.

**Akzeptanzkriterien Welle 3:**
- Statistik-Tab zeigt „gehaltene Stunden/Person" (COMPLETED-Job läuft).
- Recurring bucht Folgewochen; Reminder-E-Mail geht T−X raus.
- `en`-Locale vollständig, umschaltbar; PWA installierbar (Lighthouse PWA grün).
- Eine Gemeinde-Instanz mit eigener Farbe = reine Token-Konfiguration (kein Fork).

---

## 8. Test-/Verifikationsstrategie

### 8.1 Welle 1 — „das System steht"
- **Contrast-Gate (Fixpunkt 1):** Skript/Checker über alle Text↔Fläche-Paarungen Light+Dark; jede AA (≥4.5:1 Text, ≥3:1 UI-Grenze). Reißende Paarung → nur L nachjustieren + in §3.3 dokumentieren.
- **ESLint-Gate:** `no-restricted-syntax` grün = keine Roh-Palette mehr.
- **Visuell:** die 7 Screens in Light+Dark rendern (Dev-Server + Screenshot), gegen Vision-Screenshots halten. Kein Emoji, kein externer Font-Request.
- **StrictMode-Verify:** Dev-Login-Flow einmal durchklicken (Doppel-Effect) → landet auf `/dashboard`.
- **Backend-Unit:** angepasster `auth.test.ts` (Grace-Idempotenz); neuer CORS-Test (zweite Origin via `CORS_ORIGINS` erlaubt, fremde verboten).

### 8.2 Welle 2 — „das Herzstück wirkt"
- **Unit:** `deriveSlotState` Matrix (alle Zustände inkl. NOW/PENDING/CONFLICT); `buildSlotGrid` mit `slotId`/`isMine`/`slotDurationMinutes`; `maskName`.
- **API-Integration:** GET-Grid liefert `slotId`+`isMine`; POST gibt `guestToken` bei Gast; DELETE per `guestToken` storniert, fremder Token = 403; DELETE eigener Slot eingeloggt = 204.
- **E2E-Flows (Seed „Gebetskette für Lena", 48h):** (a) eingeloggt buchen→Undo; (b) 409 durch Parallel-Buchung → Shake+Rollback; (c) Gast: Join→Slot→Formular→.ics→Token-Storno; (d) Storno nur aus Sheet.
- **Zeit:** Projekt-TZ ≠ Browser-TZ → TimezoneHint sichtbar, beide Zeiten im Sheet. `grep` „toLocaleString" in `src/app/**` = leer.

### 8.3 Welle 3
- COMPLETED-Job-Test (Slot vorbei → Status); Recurring-Merge-Test; Reminder-Job (Fake-Timer, Mailer-Mock). Lighthouse PWA. White-Label-Smoke: zweiter Token-Satz kippt Slot-Farben ohne Code-Änderung.

---

## 9. Risiken / Offene Punkte

- **R1 — Namen-Sichtbarkeit (E5):** einzige `USER-BESTÄTIGUNG nötig`. Default (Maskierung für Anonyme) ist implementiert; Umschalten = Einzeiler in `maskName`-Aufruf. **Vorlegen bevor Welle 2 live geht.**
- **R2 — WCAG vs. Vision-Farben:** Fixpunkt 1 erlaubt nur L-Anpassung. Falls `--accent` als Weiß-auf-Fill unter 4.5:1 liegt, muss L gesenkt werden — kann die Amber-Anmutung minimal verschieben. Dokumentationspflicht in §3.3.
- **R3 — Dark-Fallback-Duplikat:** der `@media (prefers-color-scheme)`-Block dupliziert die Dark-Tokens (CSS-Limitation). Drift-Risiko → per PostCSS-Nesting oder Kommentar-Anker synchron halten.
- **R4 — „2 Bugs" nicht im Repo dokumentiert:** die Vision überschätzt den Doku-Stand. Diese Spec ist die Erstdokumentation; die Fixes (§6.4/§6.5) sind gegen den *Code*-Mechanismus verifiziert, nicht gegen ein bestehendes Bug-Ticket.
- **R5 — guestName eingeloggt ignoriert (Vision §0):** heute gewinnt `userName` (User-Relation) über `guestName` in der Anzeige. Mit `isMine`/`slotId` (§6.1) ist das Thema entschärft (Identität ≠ String); kein separater Fix nötig, nur nicht mehr `guestName` bei eingeloggter Buchung senden (FE `bookSlot`-Helper).
- **R6 — `/projects`-Index fehlt:** Home verlinkt ins Leere. Welle 1 biegt den Link auf `/dashboard`; ein echter Index bleibt Non-Scope.
- **R7 — SQLite-Enums als String:** Migrationen additiv unkritisch; bei `Membership`-Rollen (Welle 3) Zod-Constraint an der API-Grenze nicht vergessen (DB erzwingt nichts).
- **R8 — Membership-Timing (E6):** Wenn Feed/Notifs früher gewünscht werden, muss `Membership` vorgezogen werden — `isMine` bleibt davon unberührt (userId-Vergleich).
```
