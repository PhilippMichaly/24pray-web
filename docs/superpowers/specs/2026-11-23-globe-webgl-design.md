# WebGL-Erde auf der Landing — Design

**Datum:** 2026-11-23
**Status:** freigegeben und umgesetzt (2026-11-26)
**Ausgangspunkt:** Prototyp `src/components/patterns/GlobeGL.tsx`, gezeigt auf `/de/globe-lab` und vom Auftraggeber als „gut" abgenommen.

## Absicht

Die Erde ist das größte Bild der Landing. Heute wird sie in JavaScript Pixel für Pixel gerechnet
(Canvas 2D, 30 fps, feste Sonne). Sie soll technisch und optisch auf den Stand der Zeit kommen und
dabei eine Aussage tragen: **Die Gebetswache wandert mit der Nacht um die Welt.** Der Besucher sieht
die Erde so, wie sie bei ihm gerade ist.

## Entscheidungen des Auftraggebers

- Weg A: eigener WebGL2-Shader, keine neue Abhängigkeit.
- Der Prototyp ist in Aussehen und Verhalten die Vorlage.
- Start immer nach lokaler Uhrzeit: der Längengrad des Besuchers steht in der Bildmitte, die Sonne
  steht dort, wo sie wirklich steht.
- Die Kugel bleibt beweglich: Ziehen mit Trägheit, Klick-Flug zu einem Licht, langsame Eigendrehung
  nach Ruhe.

## Ziele

1. Die Landing zeigt `GlobeGL` statt `Globe`, mit den echten Daten aus `/stats/public`
   (gleiche Props, gleiche Karte zum fokussierten Licht).
2. Sonnenstand aus der UTC-Zeit; Stadtlichter nur nachts; Meeresglanz; Wolken mit Schatten;
   Atmosphärensaum mit Dämmerungsband; Gebetsnetz mit Bloom und Kometen-Impuls.
3. Flüssig auf üblichen Geräten, sparsam auf schwachen (siehe Leistung).
4. Kein Besucher sieht eine leere Fläche: ohne WebGL2 erscheint die bisherige Erde.

## Nicht-Ziele

- Echte Wolken- und Relief-Texturen (der Prototyp rechnet Wolken, Relief fehlt). Späterer Schritt,
  sobald Texturen bereitstehen.
- Höher aufgelöste Texturen beim Zoom.
- Tastatur- und Screenreader-Zugang zu den Lichtern. Die Erde bleibt wie bisher `aria-hidden`;
  das ist eine bekannte Lücke, aber ein eigenes Vorhaben.
- Änderungen an Texten, Knöpfen, Layout oder API.

## Anti-Ziele

- Die Landing wird beim ersten Laden spürbar langsamer.
- Handys werden heiß oder ruckeln.
- Die Erde lenkt vom Vers und den beiden Knöpfen ab (Vorgabe aus dem Design vom 2026-10-29:
  ruhige Seite, die Eigendrehung ist die einzige dauerhafte Bewegung).

## Wege, die zur Wahl standen

| Weg | Vorteil | Nachteil |
|---|---|---|
| **A. Eigener WebGL2-Shader** (gewählt) | Alles Gewünschte ohne neue Abhängigkeit, Landing bleibt leicht | Shader-Code pflegen wir selbst |
| B. three.js mit WebGPU | Fertige Effekte, modernste Schnittstelle | Viel zusätzliches JavaScript für eine einzige Kugel |
| C. Stilisierte Punktraster-Erde | Eigenständig, winzige Assets | Verliert die Wärme der echten Erde |

## Aufbau

- **`GlobeGL.tsx`** wird aus dem Prototyp zur Produktivkomponente. Die Labor-Props
  (`hourOffset`, `clouds`, `onFps`) entfallen.
- **Reine Rechenfunktionen** wandern in ein eigenes Modul `src/lib/sun.ts` und werden getestet:
  `subsolarPoint(date)` und `startLongitude(offsetJanMin, offsetJulMin)`.
- **`Globe.tsx`** bleibt unverändert als Rückfall (kein WebGL2, Shader-Fehler, Kontextverlust,
  Textur lädt nicht).
- **`landing-client.tsx`**: ein Import und ein Komponentenname ändern sich.
- **Aufräumen:** `src/app/[locale]/globe-lab/` und `e2e/lab-shot.mjs` werden gelöscht.

## Verhalten im Einzelnen

- **Start:** Längengrad aus der Zeitzone des Browsers (Normalzeit, 15° je Stunde), ohne
  Standortabfrage. Neigung fest leicht nach Norden.
- **Sonne:** wird in jedem Bild aus der aktuellen Zeit berechnet; die Seite kann stundenlang
  offen bleiben und stimmt weiter.
- **Bedienung:** unverändert gegenüber heute.
- **Reduzierte Bewegung:** keine Eigendrehung, keine Kometen, keine Wolkendrift; Flüge springen.
- **Unsichtbar:** kein Rechnen, wenn der Tab verborgen oder die Erde aus dem Bild gescrollt ist.

## Leistung

- Pixeldichte höchstens 2.
- Fällt die gemessene Bildrate in den ersten Sekunden unter 25 fps, rendert die Erde mit
  Pixeldichte 1; reicht auch das nicht, schaltet sie Wolken und Bloom ab.
- Abnahme auf echten Geräten (ein Desktop, ein Mittelklasse-Android, ein iPhone) vor dem Deploy.
  Der Prototyp wurde bisher nur im Headless-Browser mit Software-Rendering gesehen; echte
  Bildraten sind ungemessen.

## Festlegungen des Umsetzers (nicht vom Auftraggeber entschieden)

- Sterne funkeln nicht mehr, damit die Seite ruhig bleibt.
- Die Wolkendrift bleibt, weil sie kaum wahrnehmbar langsam ist.
- Der im Prototyp noch sichtbare orange Streifen auf der Nachtseite wird beim Feinschliff entfernt.
- Bei Kontextverlust wird auf die alte Erde gewechselt statt den Kontext wiederherzustellen.

## Tests

- `sun.ts`: Sonnenwenden und Tagundnachtgleiche (Breite), 12:00 UTC (Länge 0), Start-Längengrad
  für Berlin, New York, Sydney inklusive Sommerzeit.
- `GlobeGL`: ohne WebGL2 (jsdom) rendert sie die alte Erde und wirft nicht.
- Bestehende Landing-Tests bleiben grün; `tsc`, `next lint`, `vitest`.
- Sichtprüfung per Screenshot zu vier Tageszeiten, Freigabe durch den Auftraggeber vor dem Deploy.

## Offen für den Umsetzer

- Genaue Schwellen und Messfenster der Leistungsstufen.
- Feinabstimmung von Helligkeit, Bloom und Dämmerungsband.
