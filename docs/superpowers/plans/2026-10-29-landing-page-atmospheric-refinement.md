# Landing Page Atmospheric Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernisiere die vorhandene Landing Page visuell und technisch, ohne Erde, Bibelvers, beide CTAs, Erklärinhalte oder Produktverhalten grundlegend zu verändern.

**Architecture:** `page.tsx` wird die vollständige serverseitige Komposition; nur Globus, Live-Daten und vorhandene Menüs bleiben Client-Inseln. Ein sofort sichtbares Poster wird progressiv durch Canvas 2D ersetzt, während Datenaktualisierung, Frame-Steuerung und zugängliche DOM-Alternativen klar vom Renderer getrennt werden.

**Tech Stack:** Next.js 15.5 App Router, React 18, TypeScript, TailwindCSS 3, Canvas 2D, Zod, Vitest, Testing Library, `next/image`; Sharp und Chrome nur zur lokalen Asset-Erzeugung beziehungsweise QA.

## Global Constraints

- Kein Frameworkwechsel, kein WebGL-/Three.js-Umbau und keine neue Laufzeit-Abhängigkeit.
- Die H1 verwendet exakt `clamp(2.5rem, 4.5vw, 4rem)` und `text-wrap: balance`.
- Die CTA-Ziele `sectionPath('watches', locale)` und `/projects/new` bleiben unverändert.
- Deutsch, Englisch, Spanisch, Hebräisch und Arabisch einschließlich RTL bleiben vollständig unterstützt.
- `useFunnelPing('landing')` feuert weiterhin genau einmal pro Landing-Mount.
- Öffentliche Statistikdaten werden serverseitig mit 60 Sekunden Revalidierung und clientseitig nur bei sichtbarem Dokument alle 60 Sekunden aktualisiert.
- Keine unmarkierten Fallback-Gebetslichter; ohne gültige Daten bleiben `points` und Lichtverbindungen leer.
- Bei Reduced Motion gibt es keine Dauerschleife, Rotation, Fluganimation oder Eingangssequenz.
- Alle interaktiven Ziele haben mindestens 44 × 44 CSS-Pixel und sichtbare Fokuszustände.
- Private Wachen geben keine nichtöffentlichen Informationen preis.
- Keine neuen Marketingblöcke; das statische ChainBand ist ausdrücklich als Beispiel gekennzeichnet.
- Zielwerte nach Deployment am 75. Perzentil: LCP < 2,5 s, INP < 200 ms, CLS < 0,1. Lokale Lighthouse-Werte ersetzen keine Felddaten.
- Nach jeder Aufgabe laufen deren fokussierte Tests; vor Abschluss müssen `npm test`, `npm run lint` und `npm run build` bestehen.

## File Structure

- `src/app/[locale]/page.tsx`: serverseitige Landing-Komposition, Metadaten und JSON-LD.
- `src/app/[locale]/globe-experience.tsx`: einzige landing-spezifische Client-Insel für Statistik, Globus, Listenalternative und Detailkarte.
- `src/app/[locale]/landing-client.tsx`: nach der Server-Komposition entfernen.
- `src/components/patterns/LandingChainPreview.tsx`: nichtinteraktive, mit 24 Zellen fest definierte Produktminiatur.
- `src/components/patterns/GlobeStage.tsx`: Poster, reservierte Bildfläche und Wechsel zur Canvas.
- `src/components/patterns/Globe.tsx`: ausschließlich Canvas-Rendering und direkte Pointer-Interaktion.
- `src/components/patterns/globe-data.ts`: reine ChainPoint-/Arc-Berechnung ohne Browser-Abhängigkeit.
- `src/components/patterns/globe-scheduler.ts`: von DOM und Canvas unabhängige Frame-Steuerung.
- `src/hooks/use-public-stats.ts`: fehlertolerante, sichtbarkeitsgesteuerte Aktualisierung mit letztem gültigem Stand.
- `src/lib/public-stats.ts`: gemeinsames Zod-Schema und öffentliche Typen.
- `src/lib/api-server.ts`: anonymer serverseitiger `/stats/public`-Abruf.
- `src/lib/i18n.ts`: neue Landing-Labels in allen fünf Katalogen.
- `src/app/globals.css`: Hero-Atmosphäre, Grain und einmalige Eingangsanimation.
- `public/earth/`: Poster, Grain und moderne Texturformate neben JPEG-Fallbacks.
- `next.config.mjs`: AVIF/WebP für das über `next/image` ausgelieferte Poster.

---

### Task 1: Visuelle Bühne und statische ChainBand-Miniatur

**Files:**
- Create: `src/components/patterns/LandingChainPreview.tsx`
- Create: `src/components/patterns/LandingChainPreview.test.tsx`
- Create: `public/earth/grain.png`
- Modify: `src/app/[locale]/landing-client.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/lib/i18n.ts`
- Test: `src/lib/i18n.test.ts`

**Interfaces:**
- Consumes: vorhandene semantische Tokens, `t()` und die vorhandene Landing-Komposition.
- Produces: `LandingChainPreview({ label }: { label: string })`; Übersetzungskey `landingChainExample`; CSS-Klassen `landing-stage`, `landing-enter` und `landing-enter-delay`.

- [ ] **Step 1: Schreibe den fehlschlagenden Komponententest**

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LandingChainPreview } from './LandingChainPreview';

describe('LandingChainPreview', () => {
  it('zeigt genau 24 nichtinteraktive Zellen und eine Beispielbeschriftung', () => {
    const { container } = render(<LandingChainPreview label="Beispiel einer 24-Stunden-Gebetswache" />);
    expect(screen.getByRole('img', { name: 'Beispiel einer 24-Stunden-Gebetswache' })).toBeTruthy();
    expect(container.querySelectorAll('[data-chain-cell]')).toHaveLength(24);
    expect(container.querySelectorAll('button, a')).toHaveLength(0);
    expect(screen.getByText('Beispiel einer 24-Stunden-Gebetswache')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Verifiziere den erwarteten Testfehler**

Run: `npm test -- src/components/patterns/LandingChainPreview.test.tsx`  
Expected: FAIL, weil `./LandingChainPreview` nicht existiert.

- [ ] **Step 3: Implementiere die reine, nichtinteraktive Miniatur**

```tsx
const CELLS = [
  1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1,
  1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1,
] as const;

export function LandingChainPreview({ label }: { label: string }) {
  return (
    <figure className="mx-auto mt-8 max-w-xl">
      <div
        role="img"
        aria-label={label}
        className="grid grid-cols-24 gap-[3px] rounded-lg border border-line bg-surface/60 p-4 shadow-1"
      >
        {CELLS.map((filled, index) => (
          <span
            key={index}
            data-chain-cell
            aria-hidden
            className={filled
              ? 'h-3 rounded-[3px] bg-accent/70 shadow-[0_0_7px_1px_hsl(var(--gold)/0.28)]'
              : 'h-3 rounded-[3px] border border-dashed border-line bg-surface-sunken'}
          />
        ))}
      </div>
      <figcaption className="mt-2 text-center text-xs text-ink-muted">{label}</figcaption>
    </figure>
  );
}
```

- [ ] **Step 4: Ergänze das Beispiel-Label in allen Sprachen und teste die Kataloge**

Füge `landingChainExample` unmittelbar im Landing-Abschnitt jedes Katalogs hinzu:

```ts
// de
landingChainExample: 'Beispiel einer 24-Stunden-Gebetswache',
// en
landingChainExample: 'Example of a 24-hour prayer watch',
// es
landingChainExample: 'Ejemplo de una vigilia de oración de 24 horas',
// he
landingChainExample: 'דוגמה למשמרת תפילה של 24 שעות',
// ar
landingChainExample: 'مثال على سهرة صلاة مدتها 24 ساعة',
```

Ergänze in `src/lib/i18n.test.ts`:

```ts
it('landingChainExample ist in jeder Locale explizit übersetzt', () => {
  for (const locale of SUPPORTED_LOCALES) {
    expect(translate(locale, 'landingChainExample').length).toBeGreaterThan(10);
    if (locale !== 'de') {
      expect(translate(locale, 'landingChainExample')).not.toBe(translate('de', 'landingChainExample'));
    }
  }
});
```

- [ ] **Step 5: Integriere Miniatur, H1-Hierarchie und Vertrauenshinweis**

Rendere in `page.tsx` direkt nach der „So funktioniert es“-Sektion:

```tsx
<LandingChainPreview label={t('landingChainExample')} />
```

Gib der Schrittliste auf Desktop eine verbundene Dreierstruktur:

```tsx
<ol className="mt-4 space-y-5 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
```

Ersetze die bisherige FAQ-`<dl>` durch native Disclosures, ohne die `FAQ_KEYS` oder JSON-LD zu verändern:

```tsx
<div className="mt-4 divide-y divide-line border-y border-line">
  {FAQ_KEYS.map(([q, a]) => (
    <details key={q} className="group py-4">
      <summary className="min-h-11 cursor-pointer rounded-md py-2.5 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        {t(q)}
      </summary>
      <p className="pb-2 text-sm leading-relaxed text-ink-muted">{t(a)}</p>
    </details>
  ))}
</div>
```

Setze unmittelbar vor den bestehenden Container `div.mx-auto.w-full.max-w-2xl` dieses öffnende Element und schließe es unmittelbar nach diesem Container. Der vorhandene Container mit allen Sektionen, der Miniatur und den internen Links bleibt dabei unverändertes Kind:

```tsx
<div className="landing-content">
```

Ändere in `landing-client.tsx` die H1-Klasse und ergänze den vorhandenen Text unter den beiden CTAs:

```tsx
<h1 className="landing-enter mt-5 max-w-[15ch] text-balance text-center font-display text-[clamp(2.5rem,4.5vw,4rem)] font-semibold leading-[1.08] tracking-tight">
  {t('heroTitle')}
</h1>
```

```tsx
<p className="landing-enter landing-enter-delay mt-3 text-center text-sm text-ink-muted">
  {t('noAccountNeeded')}
</p>
```

Versehe die äußerste Hero-Fläche zusätzlich mit `landing-stage`; Bibelvers und CTAs erhalten `landing-enter`, die CTAs zusätzlich `landing-enter-delay`. Der Footer wechselt von `text-xs ... opacity-70` zu `text-sm text-ink-muted` ohne Opacity-Absenkung.

- [ ] **Step 6: Erzeuge Grain und implementiere die atmosphärische CSS-Bühne**

Run:

```bash
convert -size 128x128 xc:'#808080' +noise Random -colorspace gray public/earth/grain.png
```

Füge am Ende von `globals.css` hinzu:

```css
.landing-stage {
  isolation: isolate;
  background:
    radial-gradient(ellipse at 50% 34%, hsl(var(--night) / 0.13), transparent 46%),
    radial-gradient(ellipse at 82% 42%, hsl(var(--gold) / 0.07), transparent 34%),
    hsl(var(--bg));
}

.landing-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: url('/earth/grain.png');
  opacity: 0.025;
  mix-blend-mode: soft-light;
}

.landing-content {
  position: relative;
}

.landing-content::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 96px;
  pointer-events: none;
  background: linear-gradient(to bottom, #12141f, transparent);
}

.landing-content > div {
  position: relative;
}

.landing-enter {
  animation: landing-enter 400ms var(--ease-enter) both;
}

.landing-enter-delay {
  animation-delay: 100ms;
}

@keyframes landing-enter {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Das vorhandene globale Reduced-Motion-Media-Query bleibt unverändert und reduziert diese Animation bereits.

- [ ] **Step 7: Prüfe die Aufgabe**

Run: `npm test -- src/components/patterns/LandingChainPreview.test.tsx src/lib/i18n.test.ts`  
Expected: PASS. Kontrolliere zusätzlich im Browser, dass die 24 Zellen keine Buttons enthalten und die H1 bei 390 px sowie 1440 px nicht überläuft.

- [ ] **Step 8: Commit**

```bash
git add src/components/patterns/LandingChainPreview.tsx src/components/patterns/LandingChainPreview.test.tsx public/earth/grain.png 'src/app/[locale]/landing-client.tsx' 'src/app/[locale]/page.tsx' src/app/globals.css src/lib/i18n.ts src/lib/i18n.test.ts
git commit -m "feat(landing): veredele Hero und Produktminiatur"
```

---

### Task 2: Öffentliches Statistikschema und Server-Abruf

**Files:**
- Create: `src/lib/public-stats.ts`
- Modify: `src/lib/api-server.ts`
- Test: `src/lib/api-server.test.ts`

**Interfaces:**
- Consumes: vorhandenes generisches `getJson<T>(path, revalidate)`.
- Produces: `ChainPoint`, `PublicStats`, `publicStatsSchema` und `fetchPublicStats(revalidate = 60): Promise<PublicStats | null>`.

- [ ] **Step 1: Schreibe fehlschlagende Tests für gültige, ungültige und fehlerhafte Antworten**

Ergänze `src/lib/api-server.test.ts` im Import um `fetchPublicStats` und füge hinzu:

```ts
describe('fetchPublicStats', () => {
  it('validiert öffentliche Statistik und nutzt 60 Sekunden Revalidierung', async () => {
    const spy = vi.fn(async (_url: string, options: unknown) => ({
      ok: true,
      status: 200,
      json: async () => ({ activeChains: 2, heldSlots: 17, completedHours: 9.5, points: [] }),
      options,
    }));
    vi.stubGlobal('fetch', spy);
    await expect(fetchPublicStats()).resolves.toMatchObject({ activeChains: 2, heldSlots: 17 });
    expect(spy.mock.calls[0][1]).toMatchObject({ next: { revalidate: 60 } });
  });

  it('weist ungültige Koordinaten und Netzwerkfehler ohne Exception zurück', async () => {
    mockFetch(() => ({ activeChains: 1, heldSlots: 1, points: [{ lat: 'Berlin' }] }));
    expect(await fetchPublicStats()).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await fetchPublicStats()).toBeNull();
  });
});
```

- [ ] **Step 2: Verifiziere den erwarteten Fehler**

Run: `npm test -- src/lib/api-server.test.ts`  
Expected: FAIL, weil `fetchPublicStats` noch nicht exportiert wird.

- [ ] **Step 3: Definiere Schema und serialisierbare öffentliche Typen**

Erstelle `src/lib/public-stats.ts`:

```ts
import { z } from 'zod';

const linkSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  active: z.boolean(),
});

export const chainPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  id: z.string().optional(),
  title: z.string().optional(),
  locationName: z.string().nullable().optional(),
  links: z.array(linkSchema).optional(),
});

export const publicStatsSchema = z.object({
  activeChains: z.number().int().nonnegative(),
  heldSlots: z.number().int().nonnegative(),
  completedHours: z.number().nonnegative().optional(),
  points: z.array(chainPointSchema).optional(),
});

export type ChainPoint = z.infer<typeof chainPointSchema>;
export type PublicStats = z.infer<typeof publicStatsSchema>;
```

- [ ] **Step 4: Implementiere den toleranten Server-Abruf**

Importiere Schema und Typ in `api-server.ts` und ergänze:

```ts
export async function fetchPublicStats(revalidate = 60): Promise<PublicStats | null> {
  const value = await getJson<unknown>('/stats/public', revalidate);
  const parsed = publicStatsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
```

- [ ] **Step 5: Prüfe und committe**

Run: `npm test -- src/lib/api-server.test.ts`  
Expected: PASS.

```bash
git add src/lib/public-stats.ts src/lib/api-server.ts src/lib/api-server.test.ts
git commit -m "feat(landing): validiere öffentliche Statistik serverseitig"
```

---

### Task 3: Fehlertoleranter Statistik-Hook

**Files:**
- Create: `src/hooks/use-public-stats.ts`
- Create: `src/hooks/use-public-stats.test.ts`

**Interfaces:**
- Consumes: `api.get<PublicStats>('/stats/public')` und serverseitige `initialStats`.
- Produces: `usePublicStats(initialStats: PublicStats | null): PublicStats | null`.

- [ ] **Step 1: Schreibe Tests für letzten gültigen Stand und verborgenes Dokument**

```ts
// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePublicStats } from './use-public-stats';

const initial = { activeChains: 1, heldSlots: 4, points: [] };
const fresh = { activeChains: 2, heldSlots: 8, points: [] };
const get = vi.fn();

vi.mock('@/lib/api', () => ({ api: { get: (...args: unknown[]) => get(...args) } }));

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  get.mockReset();
});

function visibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
}

describe('usePublicStats', () => {
  it('behält nach einem Fehler den letzten gültigen Stand', async () => {
    vi.useFakeTimers();
    visibility('visible');
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => usePublicStats(initial));
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(result.current).toEqual(initial);
  });

  it('pollt nicht bei verborgenem Dokument und lädt ohne Initialwert sofort', async () => {
    vi.useFakeTimers();
    visibility('hidden');
    get.mockResolvedValue(fresh);
    const { result } = renderHook(() => usePublicStats(null));
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });
    expect(get).not.toHaveBeenCalled();
    visibility('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(get).toHaveBeenCalledWith('/stats/public');
    expect(result.current).toEqual(fresh);
  });
});
```

- [ ] **Step 2: Verifiziere den erwarteten Fehler**

Run: `npm test -- src/hooks/use-public-stats.test.ts`  
Expected: FAIL, weil der Hook nicht existiert.

- [ ] **Step 3: Implementiere den Hook mit Sequenzschutz**

```ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { PublicStats } from '@/lib/public-stats';

export function usePublicStats(initialStats: PublicStats | null): PublicStats | null {
  const [stats, setStats] = useState<PublicStats | null>(initialStats);
  const initialRef = useRef(initialStats);

  useEffect(() => {
    let mounted = true;
    let sequence = 0;

    const load = async () => {
      const ownSequence = ++sequence;
      try {
        const next = await api.get<PublicStats>('/stats/public');
        if (mounted && ownSequence === sequence) setStats(next);
      } catch {
        // Der letzte gültige Stand bleibt absichtlich sichtbar.
      }
    };

    if (!initialRef.current && document.visibilityState === 'visible') void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return stats;
}
```

- [ ] **Step 4: Prüfe und committe**

Run: `npm test -- src/hooks/use-public-stats.test.ts`  
Expected: PASS.

```bash
git add src/hooks/use-public-stats.ts src/hooks/use-public-stats.test.ts
git commit -m "feat(landing): halte letzte gültige Statistik beim Polling"
```

---

### Task 4: Vollständige Server-Komposition und kleine Globe-Insel

**Files:**
- Create: `src/app/[locale]/globe-experience.tsx`
- Create: `src/app/[locale]/page.test.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Delete: `src/app/[locale]/landing-client.tsx`

**Interfaces:**
- Consumes: `usePublicStats`, `fetchPublicStats`, `getFixedT`, bestehende Header-/Footer-Komponenten.
- Produces: `GlobeExperienceProps` mit `initialStats`, `locale`, `labels`; `GlobeLabels` enthält alle Texte der Detailkarte.

- [ ] **Step 1: Schreibe den fehlschlagenden Server-Kompositionstest**

Erstelle `page.test.tsx` mit Client-Komponenten-Mocks und rendere die async Page direkt:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LandingPage from './page';

vi.mock('./globe-experience', () => ({ default: () => <div data-testid="globe-experience" /> }));
vi.mock('@/lib/api-server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api-server')>()),
  fetchPublicStats: vi.fn(async () => null),
}));
vi.mock('@/components/patterns/AppShell', () => ({ UserMenu: () => null }));
vi.mock('@/components/patterns/LocaleToggle', () => ({ LocaleToggle: () => null }));
vi.mock('@/components/patterns/FeedbackDialog', () => ({
  FeedbackDialog: () => null,
  GITHUB_REPO_URL: 'https://github.com/example/24pray',
}));

describe('LandingPage Server-Komposition', () => {
  it('liefert H1, beide CTAs und Erklärteil außerhalb der Client-Insel', async () => {
    render(await LandingPage({ params: Promise.resolve({ locale: 'de' }) }));
    expect(screen.getByRole('heading', { level: 1, name: /Gemeinsam beten/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Eine Stunde übernehmen' }).getAttribute('href')).toBe('/de/gebetswachen');
    expect(screen.getByRole('link', { name: 'Gebetswache starten' }).getAttribute('href')).toBe('/projects/new');
    expect(screen.getByRole('heading', { name: 'Was ist eine Gebetswache?' })).toBeTruthy();
    expect(screen.getByTestId('globe-experience')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Verifiziere den erwarteten Fehler**

Run: `npm test -- 'src/app/[locale]/page.test.tsx'`  
Expected: FAIL, weil `globe-experience` fehlt beziehungsweise die aktuelle Page noch keine solche Komposition besitzt.

- [ ] **Step 3: Implementiere die Client-Insel mit typisierten, serialisierbaren Labels**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, X } from 'lucide-react';
import { Globe } from '@/components/patterns/Globe';
import { Button } from '@/components/ui/Button';
import { useFunnelPing } from '@/lib/funnel';
import { usePublicStats } from '@/hooks/use-public-stats';
import type { Locale } from '@/lib/i18n';
import type { ChainPoint, PublicStats } from '@/lib/public-stats';
import { projectPath } from '@/lib/routes';

export interface GlobeLabels {
  silentChain: string;
  silentChainHint: string;
  nIntercessors: string;
  toChain: string;
  cancel: string;
}

export interface GlobeExperienceProps {
  initialStats: PublicStats | null;
  locale: Locale;
  labels: GlobeLabels;
}

export default function GlobeExperience({ initialStats, locale, labels }: GlobeExperienceProps) {
  useFunnelPing('landing');
  const stats = usePublicStats(initialStats);
  const [focusPoint, setFocusPoint] = useState<ChainPoint | null>(null);

  return (
    <div className="relative w-full max-w-[min(52vh,600px)]">
      <Globe activeChains={stats?.activeChains ?? 0} points={stats?.points} focusPoint={focusPoint} onSelectPoint={setFocusPoint} />
      {focusPoint && (
        <div className="absolute inset-x-0 bottom-2 z-20 mx-auto w-fit max-w-[92%] rounded-lg border border-gold/30 bg-surface/95 px-4 py-3 shadow-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <MapPin size={16} className="shrink-0 text-accent-strong" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{focusPoint.title ?? labels.silentChain}</p>
              <p className="text-xs text-ink-muted">
                {focusPoint.locationName ?? labels.silentChainHint}
                {(focusPoint.links?.length ?? 0) > 0 && <> · {labels.nIntercessors.replace('{n}', String(focusPoint.links!.length))}</>}
              </p>
            </div>
            {focusPoint.id && <Button asChild size="sm" className="shrink-0"><Link href={projectPath(locale, focusPoint.id)}>{labels.toChain}</Link></Button>}
            <button onClick={() => setFocusPoint(null)} aria-label={labels.cancel} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Ziehe Header, Hero, CTAs und Footer in die Server-Page um**

Entferne den `LandingClient`-Import. Hole parallel zu den bisherigen Berechnungen `const initialStats = await fetchPublicStats();`. Übernimm die bisherigen Header-/Footer-Elemente aus `landing-client.tsx` in den ersten serverseitigen Wrapper mit `data-theme="dark"` und `landing-stage`; `UserMenu`, `LocaleToggle` und `FeedbackDialog` bleiben dabei Client-Kinder.

Ersetze den bisherigen Globus-Block durch:

```tsx
<GlobeExperience
  initialStats={initialStats}
  locale={locale}
  labels={{
    silentChain: t('silentChain'),
    silentChainHint: t('silentChainHint'),
    nIntercessors: t('nIntercessors', { n: '{n}' }),
    toChain: t('toChain'),
    cancel: t('cancel'),
  }}
/>
```

Die H1, Vers, Quellenangabe, beide CTAs, der Vertrauenshinweis und die Task-1-Klassen werden als serverseitiges JSX in dieselbe Hero-Komposition übernommen. `sectionPath('watches', locale)` und `/projects/new` bleiben exakt gleich. Anschließend `landing-client.tsx` löschen; kein verbleibender Import darf auf diese Datei zeigen.

- [ ] **Step 5: Prüfe Server-Inhalt und bestehende Tests**

Run: `npm test -- 'src/app/[locale]/page.test.tsx' src/hooks/use-public-stats.test.ts src/components/patterns/LandingChainPreview.test.tsx`  
Expected: PASS. Prüfe zusätzlich mit `curl`, dass `/de` bereits H1 und CTAs im HTML enthält.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/[locale]/page.tsx' 'src/app/[locale]/page.test.tsx' 'src/app/[locale]/globe-experience.tsx' 'src/app/[locale]/landing-client.tsx'
git commit -m "refactor(landing): rendere Hero serverseitig"
```

---

### Task 5: Wahrheitsgemäße Globusdaten ohne Szenen-Reset

**Files:**
- Create: `src/components/patterns/globe-data.ts`
- Create: `src/components/patterns/globe-data.test.ts`
- Create: `src/components/patterns/Globe.test.tsx`
- Modify: `src/components/patterns/Globe.tsx`
- Modify: `src/app/[locale]/globe-experience.tsx`

**Interfaces:**
- Consumes: `ChainPoint` aus `src/lib/public-stats.ts`.
- Produces: `buildArcs(points: ChainPoint[]): GlobeArc[]`, `latLonToVec`; `GlobeProps` ohne `activeChains`.

- [ ] **Step 1: Schreibe Datentests gegen Fallback-Aktivität**

```ts
import { describe, expect, it } from 'vitest';
import { buildArcs } from './globe-data';

describe('buildArcs', () => {
  it('liefert ohne gültige Punkte weder Lichter noch Verbindungen', () => {
    expect(buildArcs([])).toEqual([]);
  });

  it('bildet jeden realen Link mit Aktivstatus ab', () => {
    const arcs = buildArcs([{ lat: 52.5, lon: 13.4, links: [
      { lat: 48.1, lon: 11.6, active: true },
      { lat: 40.7, lon: -74, active: false },
    ] }]);
    expect(arcs).toHaveLength(2);
    expect(arcs.map((arc) => arc.active)).toEqual([true, false]);
    expect(arcs[0].pts).toHaveLength(27);
  });
});
```

- [ ] **Step 2: Schreibe den Regressionstest gegen Neuinitialisierung**

In `Globe.test.tsx` wird die Texturdekodierung absichtlich offen gelassen; dadurch wird nur die Szeneninitialisierung gemessen:

```tsx
// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Globe } from './Globe';

const context = {
  createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  putImageData: vi.fn(),
};

describe('Globe Datenaktualisierung', () => {
  afterEach(() => vi.restoreAllMocks());

  it('initialisiert Canvas und Geometrie bei neuen points nicht erneut', () => {
    vi.stubGlobal('Image', class { decode = () => new Promise<void>(() => {}); });
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never);
    const { rerender } = render(<Globe points={[{ lat: 1, lon: 2 }]} />);
    const calls = getContext.mock.calls.length;
    rerender(<Globe points={[{ lat: 3, lon: 4 }]} />);
    expect(getContext).toHaveBeenCalledTimes(calls);
  });
});
```

- [ ] **Step 3: Verifiziere die erwarteten Fehler**

Run: `npm test -- src/components/patterns/globe-data.test.ts src/components/patterns/Globe.test.tsx`  
Expected: FAIL wegen fehlendem `globe-data` und erneuter Initialisierung durch den bisherigen Effekt mit `[activeChains, points]`.

- [ ] **Step 4: Extrahiere die reine Arc-Berechnung**

```ts
import type { ChainPoint } from '@/lib/public-stats';

export type Vec3 = [number, number, number];
export interface GlobeArc { pts: Vec3[]; active: boolean }

export function latLonToVec(latDeg: number, lonDeg: number): Vec3 {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const theta = Math.acos(dot);
  if (theta < 1e-4) return a;
  const sinTheta = Math.sin(theta);
  const first = Math.sin((1 - t) * theta) / sinTheta;
  const second = Math.sin(t * theta) / sinTheta;
  return [a[0] * first + b[0] * second, a[1] * first + b[1] * second, a[2] * first + b[2] * second];
}

export function buildArcs(points: ChainPoint[]): GlobeArc[] {
  return points.flatMap((point) => {
    const target = latLonToVec(point.lat, point.lon);
    return (point.links ?? []).map((link) => {
      const from = latLonToVec(link.lat, link.lon);
      const pts = Array.from({ length: 27 }, (_, index) => {
        const t = index / 26;
        const value = slerp(from, target, t);
        const lift = 1 + 0.07 * Math.sin(Math.PI * t);
        return [value[0] * lift, value[1] * lift, value[2] * lift] as Vec3;
      });
      return { pts, active: link.active };
    });
  });
}
```

- [ ] **Step 5: Entkopple Datenupdates vom Renderer-Lebenszyklus**

In `Globe.tsx`:

- Entferne `FALLBACK_POINTS`, die lokale `ChainPoint`-Definition und `activeChains` aus `GlobeProps`; importiere `ChainPoint` aus `@/lib/public-stats`.
- Entferne die lokale `latLonToVec`- und `slerp`-Definition und importiere `latLonToVec`, `buildArcs`, `GlobeArc` aus `globe-data`.
- Ergänze `const pointsRef = useRef(points);` und `const sceneDirtyRef = useRef(true);`.
- Aktualisiere in einem eigenen Effekt nur diese Refs:

```tsx
useEffect(() => {
  pointsRef.current = points;
  sceneDirtyRef.current = true;
}, [points]);
```

- Der Initialisierungseffekt erhält die Abhängigkeit `[]`. Innerhalb dieses Effekts ersetzen `let chainPts: ChainPoint[] = []` und `let arcs: GlobeArc[] = []` die bisherigen Konstanten. Diese Funktion liegt vor dem Hit-Test und Frame-Loop:

```ts
function updateScene() {
  if (!sceneDirtyRef.current) return;
  chainPts = pointsRef.current ?? [];
  arcs = buildArcs(chainPts);
  sceneDirtyRef.current = false;
}
```

Rufe `updateScene()` unmittelbar vor dem Hit-Test in `onUp` und am Anfang von `frame` auf. Rotation, Zoom, Texturen und `buildGeometry` bleiben bei reinen Datenupdates unangetastet. Entferne in `globe-experience.tsx` das nicht mehr vorhandene `activeChains`-Prop.

- [ ] **Step 6: Prüfe und committe**

Run: `npm test -- src/components/patterns/globe-data.test.ts src/components/patterns/Globe.test.tsx 'src/app/[locale]/page.test.tsx'`  
Expected: PASS.

```bash
git add src/components/patterns/globe-data.ts src/components/patterns/globe-data.test.ts src/components/patterns/Globe.tsx src/components/patterns/Globe.test.tsx 'src/app/[locale]/globe-experience.tsx'
git commit -m "fix(landing): aktualisiere Globusdaten ohne Szenen-Reset"
```

---

### Task 6: Poster, moderne Texturen und progressiver Canvas-Wechsel

**Files:**
- Create: `src/components/patterns/GlobeStage.tsx`
- Create: `src/components/patterns/GlobeStage.test.tsx`
- Create: `public/earth/poster.jpg`
- Create: `public/earth/day.webp`
- Create: `public/earth/night.webp`
- Modify: `src/components/patterns/Globe.tsx`
- Modify: `src/app/[locale]/globe-experience.tsx`
- Modify: `next.config.mjs`

**Interfaces:**
- Consumes: `GlobeProps`, Next Image und die aus Task 5 resetfreien `points`.
- Produces: `GlobeStatus = 'loading' | 'ready' | 'error'`; `GlobeStage` mit denselben Globus-Interaktions-Props; `GlobeProps.onStatus?: (status: 'ready' | 'error') => void`.

- [ ] **Step 1: Schreibe den fehlschlagenden Poster-/Status-Test**

```tsx
// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlobeStage } from './GlobeStage';

let globeProps: { onStatus?: (status: 'ready' | 'error') => void };

vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <img {...props} /> }));
vi.mock('./Globe', () => ({ Globe: (props: typeof globeProps) => { globeProps = props; return <canvas data-testid="globe-canvas" />; } }));

describe('GlobeStage', () => {
  it('hält das Poster bis ready und behält es bei error', () => {
    render(<GlobeStage points={[]} focusPoint={null} onSelectPoint={() => {}} />);
    const stage = screen.getByTestId('globe-stage');
    expect(stage.getAttribute('data-canvas-status')).toBe('loading');
    expect(screen.getByRole('presentation').getAttribute('src')).toContain('/earth/poster.jpg');
    act(() => { globeProps.onStatus?.('ready'); });
    expect(stage.getAttribute('data-canvas-status')).toBe('ready');
    act(() => { globeProps.onStatus?.('error'); });
    expect(stage.getAttribute('data-canvas-status')).toBe('error');
    expect(screen.getByRole('presentation')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Verifiziere den erwarteten Fehler**

Run: `npm test -- src/components/patterns/GlobeStage.test.tsx`  
Expected: FAIL, weil `GlobeStage` fehlt.

- [ ] **Step 3: Implementiere den Status-Callback im Renderer**

Ergänze in `GlobeProps`:

```ts
onStatus?: (status: 'ready' | 'error') => void;
```

Halte den Callback wie `onSelectPoint` in einer Ref, damit er den Initialisierungseffekt nicht neu startet. Rufe nach dem ersten vollständigen `frame` mit geladenen Texturen genau einmal `onStatus('ready')` auf. Im `catch` der Textur-Promises rufe `onStatus('error')` auf und entferne die bisherige blaue Ersatzkugel; das Poster aus `GlobeStage` bleibt dadurch sichtbar.

- [ ] **Step 4: Implementiere `GlobeStage` mit reservierter Fläche**

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Globe } from './Globe';
import type { ChainPoint } from '@/lib/public-stats';

export interface GlobeStageProps {
  points?: ChainPoint[];
  focusPoint: ChainPoint | null;
  onSelectPoint: (point: ChainPoint | null) => void;
}

export function GlobeStage({ points, focusPoint, onSelectPoint }: GlobeStageProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  return (
    <div data-testid="globe-stage" data-canvas-status={status} className="relative aspect-square w-full">
      <Image
        src="/earth/poster.jpg"
        alt=""
        width={960}
        height={960}
        priority
        sizes="(min-width: 640px) min(52vh, 600px), calc(100vw - 32px)"
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${status === 'ready' ? 'opacity-0' : 'opacity-100'}`}
      />
      <div className={`absolute inset-0 transition-opacity duration-500 ${status === 'ready' ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <Globe points={points} focusPoint={focusPoint} onSelectPoint={onSelectPoint} onStatus={setStatus} />
      </div>
    </div>
  );
}
```

Ersetze in `globe-experience.tsx` die direkte `Globe`-Verwendung durch `GlobeStage` mit denselben Daten- und Fokus-Props.

- [ ] **Step 5: Erzeuge das Poster aus der echten, lichtlosen Canvas**

Starte ausschließlich das Web so, dass sowohl der serverseitige Initialabruf als auch der Browser-Abruf garantiert keine Punkte liefern. Der nicht belegte Port verhindert reale Lichter im Poster; die NASA-Texturen werden weiterhin lokal geladen:

```bash
API_URL_INTERNAL=http://127.0.0.1:65534 NEXT_PUBLIC_API_URL=http://127.0.0.1:65534 npm run dev
```

Starte anschließend Chrome separat:

```bash
google-chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/24pray-poster-chrome about:blank
```

Das folgende Node-Skript blockiert den Statistik-Call, wartet auf `data-canvas-status="ready"` und speichert genau die Canvas ohne erfundene Lichter:

```bash
node --input-type=module <<'NODE'
import { writeFileSync } from 'node:fs';
const target = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' }).then((r) => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => { socket.onopen = resolve; });
let id = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) handler.reject(new Error(JSON.stringify(message.error)));
  else handler.resolve(message.result);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const ownId = ++id;
  pending.set(ownId, { resolve, reject });
  socket.send(JSON.stringify({ id: ownId, method, params }));
});
await send('Page.enable');
await send('Network.enable');
await send('Network.setBlockedURLs', { urls: ['*stats/public*'] });
await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 960, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:3000/de' });
const evaluation = await send('Runtime.evaluate', {
  expression: `new Promise((resolve, reject) => {
    const start = Date.now();
    const poll = () => {
      const canvas = document.querySelector('[data-canvas-status="ready"] canvas');
      if (canvas) return resolve(canvas.toDataURL('image/png'));
      if (Date.now() - start > 15000) return reject(new Error('Globus wurde nicht bereit'));
      setTimeout(poll, 100);
    };
    poll();
  })`,
  awaitPromise: true,
  returnByValue: true,
});
const dataUrl = evaluation.result.value;
if (typeof dataUrl !== 'string') throw new Error(JSON.stringify(evaluation));
writeFileSync('/tmp/24pray-globe.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
socket.close();
await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
NODE
```

Erzeuge daraus das statische Quellposter:

```bash
node -e "require('sharp')('/tmp/24pray-globe.png').resize(960, 960).flatten({ background: '#12141f' }).jpeg({ quality: 88, mozjpeg: true }).toFile('public/earth/poster.jpg')"
```

- [ ] **Step 6: Erzeuge moderne Texturen und aktiviere AVIF/WebP-Auslieferung**

```bash
node -e "Promise.all(['day', 'night'].map((name) => require('sharp')('public/earth/' + name + '.jpg').webp({ quality: 86 }).toFile('public/earth/' + name + '.webp'))).catch((error) => { console.error(error); process.exit(1); })"
```

Ändere den Texturaufruf in `Globe.tsx` auf WebP mit JPEG-Fallback:

```ts
async function loadTextureWithFallback(name: 'day' | 'night') {
  try {
    return await loadTexture(`/earth/${name}.webp`);
  } catch {
    return loadTexture(`/earth/${name}.jpg`);
  }
}

Promise.all([loadTextureWithFallback('day'), loadTextureWithFallback('night')])
```

Ergänze in `next.config.mjs` oberhalb von `poweredByHeader`:

```js
images: {
  formats: ['image/avif', 'image/webp'],
},
```

- [ ] **Step 7: Prüfe Poster, Fallback und Tests**

Run: `npm test -- src/components/patterns/GlobeStage.test.tsx src/components/patterns/Globe.test.tsx`  
Expected: PASS. Prüfe im Browser mit deaktiviertem JavaScript das Poster sowie alle Texte und CTAs. Blockiere zusätzlich `day.webp` und `night.webp`: die JPEGs müssen laden. Blockiere alle vier Texturen: das Poster bleibt sichtbar.

- [ ] **Step 8: Commit**

```bash
git add src/components/patterns/GlobeStage.tsx src/components/patterns/GlobeStage.test.tsx src/components/patterns/Globe.tsx 'src/app/[locale]/globe-experience.tsx' public/earth/poster.jpg public/earth/day.webp public/earth/night.webp next.config.mjs
git commit -m "feat(landing): lade Globus progressiv aus statischem Poster"
```

---

### Task 7: Frame-Steuerung, Reduced Motion und ResizeObserver

**Files:**
- Create: `src/components/patterns/globe-scheduler.ts`
- Create: `src/components/patterns/globe-scheduler.test.ts`
- Modify: `src/components/patterns/Globe.tsx`
- Modify: `src/components/patterns/Globe.test.tsx`

**Interfaces:**
- Consumes: resetfreie Renderer-Initialisierung und `onStatus` aus den vorherigen Aufgaben.
- Produces: `createGlobeScheduler(options)` mit `invalidate()`, `setActive(active)`, `destroy()`; `invalidateRef` für Fokus-, Daten- und Resize-Ereignisse.

- [ ] **Step 1: Schreibe Scheduler-Tests mit injiziertem RAF**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createGlobeScheduler } from './globe-scheduler';

function rafQueue() {
  let id = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  return {
    callbacks,
    request: vi.fn((callback: FrameRequestCallback) => { callbacks.set(++id, callback); return id; }),
    cancel: vi.fn((key: number) => { callbacks.delete(key); }),
    flush(time: number) {
      const current = [...callbacks.values()];
      callbacks.clear();
      current.forEach((callback) => callback(time));
    },
  };
}

describe('createGlobeScheduler', () => {
  it('zeichnet normal kontinuierlich und bei Reduced Motion nur auf Anforderung', () => {
    const queue = rafQueue();
    const draw = vi.fn();
    const scheduler = createGlobeScheduler({ reducedMotion: true, draw, requestFrame: queue.request, cancelFrame: queue.cancel });
    scheduler.invalidate();
    queue.flush(100);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(queue.callbacks.size).toBe(0);
    scheduler.destroy();
  });

  it('stoppt und verwirft Frames bei inaktiver Sichtbarkeit', () => {
    const queue = rafQueue();
    const draw = vi.fn();
    const scheduler = createGlobeScheduler({ reducedMotion: false, draw, requestFrame: queue.request, cancelFrame: queue.cancel });
    scheduler.invalidate();
    scheduler.setActive(false);
    expect(queue.callbacks.size).toBe(0);
    queue.flush(100);
    expect(draw).not.toHaveBeenCalled();
    scheduler.destroy();
  });
});
```

- [ ] **Step 2: Verifiziere den erwarteten Fehler**

Run: `npm test -- src/components/patterns/globe-scheduler.test.ts`  
Expected: FAIL, weil das Modul fehlt.

- [ ] **Step 3: Implementiere den unabhängigen Scheduler**

```ts
export interface GlobeSchedulerOptions {
  reducedMotion: boolean;
  draw: (now: number) => void;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
}

export function createGlobeScheduler({ reducedMotion, draw, requestFrame, cancelFrame }: GlobeSchedulerOptions) {
  let active = true;
  let destroyed = false;
  let frameId: number | null = null;
  let lastDraw = 0;

  const invalidate = () => {
    if (!active || destroyed || frameId !== null) return;
    frameId = requestFrame(tick);
  };

  const tick = (now: number) => {
    frameId = null;
    if (!active || destroyed) return;
    if (!reducedMotion && now - lastDraw < 33) {
      invalidate();
      return;
    }
    lastDraw = now;
    draw(now);
    if (!reducedMotion) invalidate();
  };

  const setActive = (next: boolean) => {
    if (destroyed || active === next) return;
    active = next;
    if (!active && frameId !== null) {
      cancelFrame(frameId);
      frameId = null;
    } else if (active) {
      lastDraw = 0;
      invalidate();
    }
  };

  const destroy = () => {
    destroyed = true;
    if (frameId !== null) cancelFrame(frameId);
    frameId = null;
  };

  return { invalidate, setActive, destroy };
}
```

- [ ] **Step 4: Ersetze die permanente RAF-Schleife durch Ereignis- und Sichtbarkeitssteuerung**

In `Globe.tsx` besitzt die Komponente zusätzlich:

```tsx
const invalidateRef = useRef<() => void>(() => {});
```

Der Effekt für `focusPoint` ruft nach dem Setzen von `focusRef.current` `invalidateRef.current()` auf; der Effekt für `points` aus Task 5 tut dasselbe. Innerhalb des Initialisierungseffekts wird nach der Definition von `frame` der Scheduler erzeugt:

```ts
const scheduler = createGlobeScheduler({
  reducedMotion: reduced,
  draw: frame,
  requestFrame: window.requestAnimationFrame.bind(window),
  cancelFrame: window.cancelAnimationFrame.bind(window),
});
invalidateRef.current = scheduler.invalidate;
```

Entferne `raf` sowie alle direkten `requestAnimationFrame(frame)`-Aufrufe. Nach erfolgreichem Texturload, PointerDown/Move/Up und `rebuildForZoom` wird `scheduler.invalidate()` aufgerufen. `frame` zeichnet nur noch; die Fortsetzung kontrolliert der Scheduler. Der Ready-Callback bleibt im ersten tatsächlich gezeichneten Frame.

Füge Sichtbarkeitssteuerung und Cleanup hinzu:

```ts
let inViewport = true;
const syncActivity = () => scheduler.setActive(inViewport && !document.hidden);
const intersection = new IntersectionObserver(([entry]) => {
  inViewport = entry.isIntersecting;
  syncActivity();
});
intersection.observe(canvas);
document.addEventListener('visibilitychange', syncActivity);
syncActivity();
```

Im Cleanup: `intersection.disconnect()`, Listener entfernen, `scheduler.destroy()` und `invalidateRef.current = () => {}`.

- [ ] **Step 5: Implementiere verlustfreie Größenänderungen**

Mache `dpr`, `size`, `baseR`, `cx`, `cy`, `geom` und `stars` innerhalb des Effekts veränderbar. Extrahiere die Sternenerzeugung in `makeStars(dpr)`. Nach Initialisierung von Rotation und Zoom registriere:

```ts
const resize = () => {
  const nextDpr = Math.min(1.5, window.devicePixelRatio || 1);
  const nextSize = Math.max(1, Math.round(canvas.clientWidth * nextDpr));
  if (nextSize === size && nextDpr === dpr) return;
  dpr = nextDpr;
  size = nextSize;
  canvas.width = size;
  canvas.height = size;
  baseR = size * 0.42;
  cx = size / 2;
  cy = size / 2;
  geom = buildGeometry(size, baseR * zoom);
  geomZoom = zoom;
  stars = makeStars(dpr);
  drawnGeom = null;
  scheduler.invalidate();
};
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
```

`drawnGeom` und `stars` werden dafür mit `let` deklariert. Der Observer wird im Cleanup ebenfalls disconnected. `resize` setzt weder `yaw`, `pitch`, `zoom`, `focusRef` noch Texturen zurück.

- [ ] **Step 6: Ergänze die jsdom-Observer-Mocks und prüfe den Lebenszyklus**

jsdom stellt die beiden Browser-Observer nicht bereit. Ergänze daher in `Globe.test.tsx` vor dem vorhandenen Test:

```tsx
class ObserverMock {
  observe() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', ObserverMock);
vi.stubGlobal('ResizeObserver', ObserverMock);
vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
vi.stubGlobal('cancelAnimationFrame', vi.fn());
```

Erweitere den bestehenden `afterEach` zu `vi.restoreAllMocks(); vi.unstubAllGlobals();`. Die Mocks verhindern nur fehlende jsdom-APIs; der eigentliche Regressionstest auf erneute Canvas-Initialisierung bleibt unverändert.

Run: `npm test -- src/components/patterns/globe-scheduler.test.ts src/components/patterns/Globe.test.tsx src/components/patterns/GlobeStage.test.tsx`  
Expected: PASS. Mit aktivem Reduced Motion darf nach dem initialen Frame kein weiterer Frame ohne Interaktion entstehen. Verberge den Tab beziehungsweise scrolle den Globus aus dem Viewport: die RAF-Schleife stoppt. Ändere die Fenstergröße während Drag/Fokus: Rotation und Auswahl bleiben erhalten.

- [ ] **Step 7: Commit**

```bash
git add src/components/patterns/globe-scheduler.ts src/components/patterns/globe-scheduler.test.ts src/components/patterns/Globe.tsx src/components/patterns/Globe.test.tsx
git commit -m "perf(landing): steuere Globus-Rendering nach Sichtbarkeit"
```

---

### Task 8: Tastaturzugängliche Lichterliste und Detailkarte

**Files:**
- Modify: `src/app/[locale]/globe-experience.tsx`
- Create: `src/app/[locale]/globe-experience.test.tsx`
- Modify: `src/lib/i18n.ts`
- Test: `src/lib/i18n.test.ts`

**Interfaces:**
- Consumes: initial serverseitig gerenderte `points`, `GlobeStage`, `projectPath(locale, id)`.
- Produces: native `<details>`-Listenalternative, Escape-Schließen und Fokusrückkehr; Keys `lightsListToggle` und `lightsListEmpty` in fünf Sprachen.

- [ ] **Step 1: Schreibe den fehlschlagenden Interaktionstest**

```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GlobeExperience, { type GlobeLabels } from './globe-experience';

vi.mock('@/components/patterns/GlobeStage', () => ({ GlobeStage: () => <div /> }));
vi.mock('@/lib/funnel', () => ({ useFunnelPing: vi.fn() }));

afterEach(cleanup);

const labels: GlobeLabels = {
  silentChain: 'Eine stille Gebetswache betet hier.',
  silentChainHint: 'Privat — nur als Licht sichtbar.',
  nIntercessors: '{n} Betende',
  toChain: 'Zur Gebetswache',
  cancel: 'Abbrechen',
  lightsListToggle: 'Lichter als Liste anzeigen',
  lightsListEmpty: 'Zurzeit sind keine Gebetslichter sichtbar.',
};

const initialStats = {
  activeChains: 1,
  heldSlots: 2,
  points: [{ id: 'public-1', lat: 52.5, lon: 13.4, title: 'Für Berlin', locationName: 'Berlin', links: [] }],
};

describe('GlobeExperience Listenalternative', () => {
  it('öffnet per Liste die Detailkarte, verlinkt öffentlich und gibt Fokus nach Escape zurück', () => {
    render(<GlobeExperience initialStats={initialStats} locale="de" labels={labels} />);
    fireEvent.click(screen.getByText(labels.lightsListToggle));
    const trigger = screen.getByRole('button', { name: /Für Berlin/ });
    fireEvent.click(trigger);
    expect(screen.getByRole('link', { name: 'Zur Gebetswache' }).getAttribute('href')).toBe('/de/projects/public-1');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('link', { name: 'Zur Gebetswache' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
```

- [ ] **Step 2: Verifiziere den erwarteten Fehler**

Run: `npm test -- 'src/app/[locale]/globe-experience.test.tsx'`  
Expected: FAIL wegen fehlender Labels und fehlendem Listenbutton.

- [ ] **Step 3: Ergänze beide neuen Texte in allen Katalogen**

```ts
// de
lightsListToggle: 'Lichter als Liste anzeigen',
lightsListEmpty: 'Zurzeit sind keine Gebetslichter sichtbar.',
// en
lightsListToggle: 'Show lights as a list',
lightsListEmpty: 'No prayer lights are currently visible.',
// es
lightsListToggle: 'Mostrar las luces como una lista',
lightsListEmpty: 'Actualmente no hay luces de oración visibles.',
// he
lightsListToggle: 'הצגת האורות כרשימה',
lightsListEmpty: 'אין כרגע אורות תפילה גלויים.',
// ar
lightsListToggle: 'عرض الأضواء كقائمة',
lightsListEmpty: 'لا توجد أضواء صلاة ظاهرة حاليًا.',
```

Ergänze in `page.tsx` die beiden Labels mit `t('lightsListToggle')` und `t('lightsListEmpty')`. Erweitere `GlobeLabels` in `globe-experience.tsx` um dieselben beiden string-Props. Ergänze in `i18n.test.ts`:

```ts
it('übersetzt die Lichterliste in allen Locales ohne deutschen Fallback', () => {
  for (const key of ['lightsListToggle', 'lightsListEmpty'] as const) {
    for (const locale of SUPPORTED_LOCALES) {
      expect(translate(locale, key).trim().length).toBeGreaterThan(0);
      if (locale !== 'de') expect(translate(locale, key)).not.toBe(translate('de', key));
    }
  }
});
```

- [ ] **Step 4: Implementiere Escape und Fokusrückkehr**

Importiere `useCallback`, `useEffect` und `useRef`. Speichere den letzten Listenauslöser und schließe zentral:

```tsx
const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
const closeFocus = useCallback(() => {
  setFocusPoint(null);
  lastTriggerRef.current?.focus();
  lastTriggerRef.current = null;
}, []);

useEffect(() => {
  if (!focusPoint) return;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeFocus();
  };
  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}, [focusPoint, closeFocus]);
```

`GlobeStage.onSelectPoint` löscht `lastTriggerRef.current` vor `setFocusPoint`. Der bisherige Schließen-Button verwendet `closeFocus` und behält seine 44-px-Zielfläche.

- [ ] **Step 5: Implementiere die semantische Listenalternative**

Rendere direkt unter `GlobeStage` innerhalb der Globus-Insel:

```tsx
<details className="relative z-20 mx-auto mt-2 w-fit max-w-full text-center text-sm text-ink-muted">
  <summary className="min-h-11 cursor-pointer rounded-md px-3 py-2.5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
    {labels.lightsListToggle}
  </summary>
  {(stats?.points?.length ?? 0) === 0 ? (
    <p className="px-3 py-2">{labels.lightsListEmpty}</p>
  ) : (
    <ul className="max-h-64 w-[min(90vw,28rem)] space-y-1 overflow-y-auto rounded-lg border border-line bg-surface p-2 text-start shadow-3">
      {stats!.points!.map((point, index) => (
        <li key={`${point.id ?? `${point.lat},${point.lon}`}-${index}`}>
          <button
            type="button"
            className="min-h-11 w-full rounded-md px-3 py-2 text-start hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={(event) => {
              lastTriggerRef.current = event.currentTarget;
              setFocusPoint(point);
            }}
          >
            <span className="block font-medium text-ink">{point.title ?? labels.silentChain}</span>
            <span className="block text-xs text-ink-muted">{point.locationName ?? labels.silentChainHint}</span>
          </button>
        </li>
      ))}
    </ul>
  )}
</details>
```

Die Detailkarte bleibt im selben reservierten Globusbereich und erhält `role="region"` sowie ein sprechendes `aria-label` mit dem ausgewählten Titel. Kein zusätzlicher API-Abruf wird für die Liste eingeführt.

- [ ] **Step 6: Prüfe und committe**

Run: `npm test -- 'src/app/[locale]/globe-experience.test.tsx' src/lib/i18n.test.ts 'src/app/[locale]/page.test.tsx'`  
Expected: PASS. Durchlaufe die Liste zusätzlich nur mit Tab, Shift+Tab, Enter und Escape; prüfe private und öffentliche Punkte.

```bash
git add 'src/app/[locale]/globe-experience.tsx' 'src/app/[locale]/globe-experience.test.tsx' 'src/app/[locale]/page.tsx' src/lib/i18n.ts src/lib/i18n.test.ts
git commit -m "feat(landing): mache Gebetslichter tastaturzugänglich"
```

---

### Task 9: Gesamtverifikation und reproduzierbare Browser-QA

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: nur Dateien mit durch die Verifikation nachgewiesenen Fehlern

**Interfaces:**
- Consumes: alle vorherigen öffentlichen Komponenten und Hooks.
- Produces: lokal gepinnte QA-DevDependencies `lighthouse` und `@axe-core/cli`; keine neue Laufzeit-Abhängigkeit.

- [ ] **Step 1: Installiere die bislang fehlenden QA-Werkzeuge ausschließlich als DevDependencies**

```bash
npm install --save-dev lighthouse @axe-core/cli
```

Diese Werkzeuge sind im aktuellen Projekt nicht vorhanden. Der Lockfile pinnt die beim Lauf aufgelösten Versionen; keine Produktionsabhängigkeit wird ergänzt.

- [ ] **Step 2: Führe die vollständigen Standardprüfungen aus**

```bash
npm test
npm run lint
npm run build
```

Expected: alle drei Kommandos enden mit Exit 0. Ein Fehler wird in der betroffenen Datei behoben und anschließend werden alle drei Kommandos erneut ausgeführt.

- [ ] **Step 3: Starte die echte Anwendung für End-to-End-Prüfungen**

Starte in zwei getrennten Prozessen:

```bash
# api/
npm run dev
```

```bash
# web/
npm run dev
```

Prüfe `http://localhost:3000/de` mit echten API-Aufrufen. Öffne sowohl „Eine Stunde übernehmen“ als auch „Gebetswache starten“, wähle ein öffentliches Licht über Canvas und Liste und kehre über die Detailkarte zur Wache beziehungsweise per Escape zur Liste zurück. Der Buchungsflow selbst wird nicht verändert.

- [ ] **Step 4: Prüfe ohne JavaScript und mit Fehlerfällen**

Deaktiviere JavaScript in den Chrome-DevTools und lade `/de` neu. Sichtbar und benutzbar müssen sein: Poster, H1, Vers, beide CTAs, Vertrauenshinweis, Erklärteil, ChainBand-Beispiel, native FAQ und Footer-Links.

Blockiere `/api/stats/public`: keine Lichter erscheinen, die Liste meldet `lightsListEmpty`, die Seite wirft keinen Fehler. Lass einen Refresh nach erfolgreichem Initialstand fehlschlagen: letzte reale Punkte bleiben erhalten. Blockiere anschließend WebP und JPEG: das Poster bleibt sichtbar.

- [ ] **Step 5: Prüfe Viewports, Sprachen, Zoom und Reduced Motion**

Kontrolliere mindestens:

```text
390 × 844, 844 × 390, 1440 × 900
/de, /en, /es, /he, /ar
normale Bewegung und prefers-reduced-motion: reduce
100 % und 200 % Browserzoom
```

Erzeuge die visuellen Prüfbilder mit Chrome:

```bash
for locale in de en es he ar; do
  google-chrome --headless=new --window-size=390,844 --user-data-dir="/tmp/24pray-qa-$locale" --screenshot="/tmp/24pray-$locale-390.png" "http://localhost:3000/$locale"
done
google-chrome --headless=new --window-size=1440,900 --user-data-dir=/tmp/24pray-qa-desktop --screenshot=/tmp/24pray-de-1440.png http://localhost:3000/de
google-chrome --headless=new --window-size=844,390 --user-data-dir=/tmp/24pray-qa-landscape --screenshot=/tmp/24pray-de-landscape.png http://localhost:3000/de
```

Öffne alle sieben Bilder mit dem Media-Read-Werkzeug und kontrolliere sie tatsächlich visuell. Bei `/he` und `/ar` sind zusätzlich `dir="rtl"`, Listen-/Kartentext und CTA-Umbrüche zu prüfen. Keine Überlappung, abgeschnittene H1 oder horizontale Scrollbar ist zulässig.

- [ ] **Step 6: Führe automatisierte Accessibility-Scans aus**

```bash
npx axe http://localhost:3000/de http://localhost:3000/he
```

Expected: Exit 0 und keine Violations; bei Violations ist der Standard-Exitcode ungleich 0. Ein Befund wird behoben, der betroffene Komponententest ergänzt und der Scan wiederholt.

- [ ] **Step 7: Miss mobile und Desktop-Lab-Werte**

```bash
npx lighthouse http://localhost:3000/de --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=/tmp/24pray-lighthouse-mobile.html --chrome-flags="--headless=new"
npx lighthouse http://localhost:3000/de --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=/tmp/24pray-lighthouse-desktop.html --chrome-flags="--headless=new"
```

Öffne beide Berichte. Erwartet werden Accessibility 100, mobiler Lab-LCP höchstens 2,5 s, CLS höchstens 0,1 und Total Blocking Time höchstens 200 ms. Lighthouse misst kein INP; INP wird durch reale Interaktion auf einem verfügbaren Mittelklassegerät und nach Deployment am 75. Perzentil über CrUX oder ein bereits vorhandenes RUM-System beurteilt. Behaupte keine INP- oder Feld-Messung aus diesen Lab-Läufen.

- [ ] **Step 8: Wiederhole die Standardprüfungen nach allen Fixes und committe**

```bash
npm test
npm run lint
npm run build
git add package.json package-lock.json src public next.config.mjs
git commit -m "test(landing): verifiziere visuelle und technische Qualität"
```

Falls die Verifikation keinerlei Codeänderung erfordert hat, enthält der Commit nur die beiden QA-Manifestdateien. Am Ende müssen Arbeitsbaumstatus und letzte Testausgaben im Abschlussbericht genannt werden.
