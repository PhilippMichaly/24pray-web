# White-Label / Theming (W3.3)

Eine Gemeinde-Instanz mit eigener Farbe = **reine Token-Konfiguration, kein Fork**.

## Wie das Theming aufgebaut ist

- Alle Farben leben als HSL-Triple in CSS-Custom-Properties in `src/app/globals.css`
  (`:root` = Light, `[data-theme="dark"]` = Dark). Im JSX gibt es **nur** semantische
  Tailwind-Utilities (`bg-accent`, `text-ink-muted`, …) — Roh-Paletten sind per
  ESLint-Regel verboten.
- Slot-Zustandsfarben hängen an der zweiten Token-Ebene (`--slot-*`, `--chain-gap-color`)
  und können unabhängig vom Akzent überschrieben werden.
- Ein Abschnitt kann per `data-theme`-Attribut lokal auf ein Theme festgenagelt werden
  (Beispiel: die Landing rendert ihren Weltall-Hero in einem `data-theme="dark"`-Wrapper).

## Eigene Instanz einfärben

1. Kopiere die `:root`- und `[data-theme="dark"]`-Blöcke aus `globals.css` in eine
   Datei `src/app/brand.css` und importiere sie **nach** `globals.css` in `layout.tsx` —
   die späteren Definitionen gewinnen.
2. Ändere nur die HSL-Werte. Kontrast-Pflicht: Text ≥ 4.5:1, UI-Kanten ≥ 3:1
   (Checker: `scratchpad/contrast.mjs`-Muster; alle *genutzten* Paare prüfen).
3. Wortmarke/Monogramm: `src/components/patterns/Brand.tsx` ist die einzige
   Branding-Komponente — austauschbar, alle Screens beziehen sie von dort.
   PWA-Icons: `public/icons/icon.svg` ersetzen und PNGs neu generieren
   (`convert -background none -density 300 icon.svg -resize 192x192 icon-192.png`, dito 512).
4. `public/manifest.webmanifest`: `name`, `theme_color`, `background_color` anpassen.

## Sprache

`src/lib/i18n.ts` enthält `de` (Quelle) und `en` (vollständig). `t(key, params)` ist die
einzige Text-API. Ein Locale-Umschalter (Cookie-basiert, SSR-konsistent) ist noch nicht
verdrahtet — Katalog ist vorbereitet.
