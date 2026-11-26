# WebGL-Erde auf der Landing — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Landing zeigt die WebGL2-Erde aus dem Prototyp statt der Canvas-2D-Erde, mit echter Sonne, Start am Längengrad des Besuchers und der alten Erde als Rückfall.

**Architecture:** `GlobeGL.tsx` (existiert als Prototyp, unversioniert) wird zur Produktivkomponente mit denselben Props wie `Globe`. Reine Rechenlogik (Sonnenstand, Start-Längengrad, Qualitätsstufen) liegt in zwei kleinen, getesteten Modulen. `Globe.tsx` bleibt unverändert und dient als Rückfall.

**Tech Stack:** Next.js 15, React 18, TypeScript, WebGL2 (GLSL ES 3.00), vitest + jsdom + @testing-library/react. Keine neue Abhängigkeit.

**Spec:** `docs/superpowers/specs/2026-11-23-globe-webgl-design.md`

## Global Constraints

- Repo: `/home/pmi/24pray/web`. Arbeit auf Branch `feat/globe-webgl` (von `main`), nicht auf `main`.
- Keine neue npm-Abhängigkeit.
- `src/components/patterns/Globe.tsx` wird nicht verändert.
- Texte, Knöpfe, Layout und API der Landing bleiben unverändert; keine neuen i18n-Keys.
- Pixeldichte höchstens 2.
- Qualitätsstufen: unter 25 fps erst Pixeldichte 1, dann zusätzlich Wolken und Bloom aus. Nur abwärts, nie wieder aufwärts.
- Reduzierte Bewegung: keine Eigendrehung, keine Kometen, keine Wolkendrift; Flüge springen.
- Sterne funkeln nicht.
- Ein laufender `next dev` wird nicht beendet; **nie** `next build` lokal ausführen.
- Suiten je Task: `npx vitest run`, `npx tsc --noEmit`, `npx next lint --quiet`.
- Commit-Trailer laut Sitzungsvorgabe. Kein Push, kein Deploy ohne ausdrücklichen Auftrag.

## Review Focus

1. **Minütliche Datenaktualisierung:** Die Landing lädt `/stats/public` alle 60 s neu und übergibt ein neues `points`-Array. Erwartet: Blickwinkel, Zoom und Grafikkontext bleiben erhalten, nur das Netz ändert sich. (Im Prototyp startet der ganze Effekt neu und die Ansicht springt zurück.) → Test in Task 3.
2. **Kein WebGL2 oder Shader-Fehler:** Erwartet: die alte Erde erscheint, nichts wirft. → Test in Task 3.
3. **Zeitzonen UTC±0 und halbe Stunden (Indien):** Erwartet: endlicher Start-Längengrad, `0` statt `-0`. → Test in Task 1.
4. **Tab lange verborgen, dann zurück:** Erwartet: keine fälschliche Herabstufung der Qualität durch das lange Messfenster. → Test in Task 2 (Fenster mit zu wenig Bildern zählt nicht).
5. **Kontextverlust (Handy im Hintergrund):** Erwartet: Rückfall auf die alte Erde, keine leere Fläche. → Test in Task 3.

---

### Task 1: Sonnenstand und Start-Längengrad (`src/lib/sun.ts`)

**Files:**
- Create: `src/lib/sun.ts`
- Test: `src/lib/sun.test.ts`

**Interfaces:**
- Produces:
  - `subsolarPoint(date: Date): { lat: number; lon: number }` — Grad; `lon` in `[-180, 180)`.
  - `startLongitude(offsetJanMin: number, offsetJulMin: number): number` — Grad; Eingaben sind `Date#getTimezoneOffset()` vom 1. Januar und 1. Juli.

- [ ] **Step 1: Failing test schreiben**

```ts
import { describe, it, expect } from 'vitest';
import { subsolarPoint, startLongitude } from './sun';

describe('subsolarPoint', () => {
  it('Sommersonnenwende mittags UTC: ~23,44° N über Greenwich', () => {
    const p = subsolarPoint(new Date('2026-06-21T12:00:00Z'));
    expect(p.lat).toBeGreaterThan(22.9);
    expect(p.lat).toBeLessThanOrEqual(23.44);
    expect(p.lon).toBeCloseTo(0, 5);
  });
  it('Wintersonnenwende: ~23,44° S', () => {
    expect(subsolarPoint(new Date('2026-12-21T12:00:00Z')).lat).toBeLessThan(-22.9);
  });
  it('Tagundnachtgleiche: nahe am Äquator', () => {
    expect(Math.abs(subsolarPoint(new Date('2026-03-20T12:00:00Z')).lat)).toBeLessThan(1.5);
  });
  it('18:00 UTC: Sonne über 90° W; Mitternacht UTC: über der Datumsgrenze', () => {
    expect(subsolarPoint(new Date('2026-06-21T18:00:00Z')).lon).toBeCloseTo(-90, 5);
    expect(Math.abs(subsolarPoint(new Date('2026-06-21T00:00:00Z')).lon)).toBeCloseTo(180, 5);
  });
});

describe('startLongitude', () => {
  it('nimmt die Normalzeit (größerer Offset), 15° je Stunde', () => {
    expect(startLongitude(-60, -120)).toBe(15);    // Berlin
    expect(startLongitude(300, 240)).toBe(-75);    // New York
    expect(startLongitude(-660, -600)).toBe(150);  // Sydney (Sommerzeit im Januar)
    expect(startLongitude(-330, -330)).toBe(82.5); // Indien
  });
  it('UTC ergibt 0, nicht -0', () => {
    expect(Object.is(startLongitude(0, 0), 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Test läuft rot** — `npx vitest run src/lib/sun.test.ts` → FAIL (Modul fehlt).

- [ ] **Step 3: Implementieren.** `subsolarPoint` wörtlich aus `GlobeGL.tsx` übernehmen (dort bereits exportiert). `startLongitude` = `-max(offsetJan, offsetJul) / 4`, `-0` zu `0` normalisiert.

- [ ] **Step 4: Test läuft grün** — `npx vitest run src/lib/sun.test.ts` → PASS.

- [ ] **Step 5: Commit** — `git add src/lib/sun.ts src/lib/sun.test.ts && git commit -m "feat(globe): Sonnenstand und Start-Längengrad als geprüfte Rechenfunktionen"`

---

### Task 2: Qualitätsstufen (`src/components/patterns/globe-quality.ts`)

**Files:**
- Create: `src/components/patterns/globe-quality.ts`
- Test: `src/components/patterns/globe-quality.test.ts`

**Interfaces:**
- Produces:
  - `type GlobeQuality = 0 | 1 | 2` — 0 = voll; 1 = Pixeldichte 1; 2 = Pixeldichte 1 ohne Wolken und Bloom.
  - `nextQuality(current: GlobeQuality, frames: number, windowMs: number): GlobeQuality`
  - `qualitySettings(q: GlobeQuality, devicePixelRatio: number): { dpr: number; clouds: boolean; bloom: boolean }`
  - `QUALITY_WINDOW_MS = 2000`, `QUALITY_MIN_FPS = 25`

- [ ] **Step 1: Failing test schreiben**

```ts
import { describe, it, expect } from 'vitest';
import { nextQuality, qualitySettings } from './globe-quality';

describe('nextQuality', () => {
  it('bleibt bei 25 fps und mehr', () => {
    expect(nextQuality(0, 50, 2000)).toBe(0);
    expect(nextQuality(1, 120, 2000)).toBe(1);
  });
  it('stuft unter 25 fps genau eine Stufe ab, höchstens bis 2', () => {
    expect(nextQuality(0, 49, 2000)).toBe(1);
    expect(nextQuality(1, 10, 2000)).toBe(2);
    expect(nextQuality(2, 1, 2000)).toBe(2);
  });
  it('wertet kein Fenster, das länger als das Doppelte dauerte (Tab war verborgen)', () => {
    expect(nextQuality(0, 3, 60_000)).toBe(0);
  });
});

describe('qualitySettings', () => {
  it('Stufe 0: Pixeldichte höchstens 2, alles an', () => {
    expect(qualitySettings(0, 3)).toEqual({ dpr: 2, clouds: true, bloom: true });
    expect(qualitySettings(0, 1.5)).toEqual({ dpr: 1.5, clouds: true, bloom: true });
  });
  it('Stufe 1: Pixeldichte 1', () => {
    expect(qualitySettings(1, 3)).toEqual({ dpr: 1, clouds: true, bloom: true });
  });
  it('Stufe 2: zusätzlich Wolken und Bloom aus', () => {
    expect(qualitySettings(2, 3)).toEqual({ dpr: 1, clouds: false, bloom: false });
  });
});
```

- [ ] **Step 2: Test läuft rot** — `npx vitest run src/components/patterns/globe-quality.test.ts` → FAIL.
- [ ] **Step 3: Implementieren** (reine Funktionen, keine DOM-Zugriffe).
- [ ] **Step 4: Test läuft grün.**
- [ ] **Step 5: Commit** — `git commit -m "feat(globe): Qualitätsstufen für schwache Geräte"`

---

### Task 3: `GlobeGL` produktionsreif

**Files:**
- Modify: `src/components/patterns/GlobeGL.tsx` (Prototyp, unversioniert — wird in diesem Task erstmals committet)
- Test: `src/components/patterns/GlobeGL.test.tsx`

**Interfaces:**
- Consumes: `subsolarPoint`, `startLongitude` (Task 1); `nextQuality`, `qualitySettings`, `QUALITY_WINDOW_MS` (Task 2); `Globe`, `ChainPoint`, `GlobeProps` aus `./Globe`.
- Produces: `GlobeGL(props: GlobeProps): JSX.Element` — exakt die Props von `Globe`, keine weiteren.

- [ ] **Step 1: Failing tests schreiben** (`// @vitest-environment jsdom`; `./Globe` per `vi.mock` durch `<div data-testid="globe-fallback" />` ersetzen)

  - `'ohne WebGL2 erscheint die alte Erde'`: `HTMLCanvasElement.prototype.getContext` liefert `null` → `await findByTestId('globe-fallback')`.
  - `'Shader-Fehler führt zur alten Erde'`: Stub-Kontext, dessen `getShaderParameter` `false` liefert → `findByTestId('globe-fallback')`; `console.error` gespyt.
  - `'Kontextverlust führt zur alten Erde'`: funktionierender Stub-Kontext, dann `canvas.dispatchEvent(new Event('webglcontextlost'))` → `findByTestId('globe-fallback')`.
  - `'neue points lassen den Grafikkontext bestehen'`: funktionierender Stub-Kontext; `rerender` mit einem neuen `points`-Array gleichen Inhalts und danach mit geändertem Inhalt → `getContext` wurde mit `'webgl2'` genau einmal aufgerufen.

  Der Stub-Kontext ist ein `Proxy`, dessen Methoden `{}` zurückgeben, `getShaderParameter`/`getProgramParameter` `true`, `getExtension` `null`. In jsdom fehlen `ResizeObserver` und `IntersectionObserver`: im Test als leere Klassen auf `globalThis` setzen. `window.matchMedia` stubben (`matches: false`).

- [ ] **Step 2: Tests laufen rot** — der vierte Test schlägt fehl (zwei `getContext`-Aufrufe), die übrigen je nach Stub.

- [ ] **Step 3: Umbau von `GlobeGL.tsx`**

  1. Labor-Props `hourOffset`, `clouds`, `onFps` und `GlobeGLProps` entfernen; Signatur `GlobeGL(props: GlobeProps)`.
  2. Lokales `subsolarPoint` und die Zeitzonenrechnung löschen, aus `@/lib/sun` importieren.
  3. **Daten ohne Neustart:** Haupt-Effekt mit leerer Abhängigkeitsliste. `points` und `activeChains` in ein Ref; ein zweiter Effekt markiert sie als geändert; der Render-Loop baut `chainPts`, `chainVecs` und `arcs` dann neu. Blickwinkel, Zoom, Texturen und Kontext bleiben.
  4. **Qualitätsstufen:** nach dem Laden der Texturen 1 s überspringen, dann je `QUALITY_WINDOW_MS` Bilder zählen und `nextQuality` anwenden, für die ersten 10 s. Bei Wiederaufnahme nach Unsichtbarkeit das Fenster neu beginnen. `qualitySettings` bestimmt `dpr` (in `resize()`), Wolken (Uniform `uClouds` 0/1; im Shader `cloudCover` bei `uClouds == 0.0` sofort `0.0` zurückgeben, damit das Rauschen nicht gerechnet wird) und Bloom (Bloom-Pässe überspringen, neues Uniform `uBloomAmt` im Composite-Shader auf 0).
  5. **Sterne:** `twinkle` aus `FS_EARTH` entfernen (fester Faktor 1).
  6. **Reduzierte Bewegung:** `uTime` bleibt 0 (bereits so) — damit auch keine Wolkendrift; prüfen und beibehalten.
  7. **Oranger Streifen auf der Nachtseite:** In `FS_EARTH` den Term `scatter * atmLit * (fres * 0.55 + 0.03)` so ändern, dass der flächige Anteil (`+ 0.03`) nur mit `smoothstep(0.0, 0.2, ndl)` wirkt; der Randanteil (`fres`) bleibt.
  8. Kopfkommentar von „PROTOTYP" auf die Produktivbeschreibung ändern.

- [ ] **Step 4: Tests laufen grün** — `npx vitest run src/components/patterns/GlobeGL.test.tsx`, dann `npx tsc --noEmit` und `npx next lint --quiet`.

- [ ] **Step 5: Commit** — `git add src/components/patterns/GlobeGL.tsx src/components/patterns/GlobeGL.test.tsx && git commit -m "feat(globe): WebGL2-Erde mit echter Sonne, Rückfall und Qualitätsstufen"`

---

### Task 4: Einbau in die Landing, Labor entfernen, Sichtprüfung

**Files:**
- Modify: `src/app/[locale]/landing-client.tsx:12` (Import) und `:59` (Komponente)
- Delete: `src/app/[locale]/globe-lab/` (zwei Dateien), `/home/pmi/24pray/e2e/lab-shot.mjs`

**Interfaces:**
- Consumes: `GlobeGL` (Task 3); `ChainPoint` weiterhin aus `@/components/patterns/Globe`.

- [ ] **Step 1:** Import auf `import { GlobeGL } from '@/components/patterns/GlobeGL';` plus `import type { ChainPoint } from '@/components/patterns/Globe';` umstellen; `<Globe …>` durch `<GlobeGL …>` mit unveränderten Props ersetzen.
- [ ] **Step 2:** Laborseite und Screenshot-Skript löschen (vom Auftraggeber mit dem Design freigegeben).
- [ ] **Step 3:** Alle Suiten: `npx vitest run && npx tsc --noEmit && npx next lint --quiet` → alles grün.
- [ ] **Step 4: Sichtprüfung.** Dev-Server (web, und api für echte Daten — nur GET) nutzen bzw. starten. Mit einem Wegwerf-Skript im Scratchpad (puppeteer-core aus `/home/pmi/24pray/e2e/node_modules`, `executablePath: /usr/bin/google-chrome-stable`, `--no-sandbox --enable-unsafe-swiftshader --use-angle=swiftshader`) die Landing `/de` aufnehmen: vier Uhrzeiten (06, 12, 18, 24 Uhr Ortszeit, per `page.evaluateOnNewDocument` überschriebenes `Date`) × zwei Zeitzonen (`page.emulateTimezone('Europe/Berlin')`, `'America/New_York'`), dazu einmal Handybreite 390 px und einmal `prefers-reduced-motion`. Prüfen: keine Konsolenfehler, Besucher-Längengrad mittig, Tag/Nacht passend zur Uhrzeit, kein oranger Streifen auf der Nachtseite, Fokus-Karte nach Klick auf ein Licht erscheint.
- [ ] **Step 5:** Screenshots dem Auftraggeber schicken und Freigabe abwarten.
- [ ] **Step 6: Commit** — `git add -A src/app && git commit -m "feat(landing): WebGL-Erde ersetzt die Canvas-Erde"`

---

### Task 5: Geräteabnahme (Auftraggeber) — vor jedem Deploy

Kein Code. Der Auftraggeber öffnet den Branch-Stand auf einem Desktop, einem Mittelklasse-Android und einem iPhone und meldet: flüssig ja/nein, Gerät wird warm ja/nein, Auffälligkeiten. Deploy erst nach dieser Abnahme und nur auf ausdrücklichen Auftrag (Runbook: `24pray-api/deploy/README.md`).
