# Landing Page – Atmosphärische Veredelung

**Status:** Richtung A vom Nutzer freigegeben; Umsetzung noch nicht beauftragt  
**Priorität:** Visuelle Wirkung, verbunden mit technischer Qualität  
**Ausgangspunkt:** Bestehende Next.js-Landing-Page mit interaktiver Canvas-Erde, Bibelvers, zwei CTAs und serverseitig gerendertem Erklärteil

## 1. Ziel und Abgrenzung

Die Landing Page soll hochwertiger, ruhiger und eigenständiger wirken, ohne ihr Grundkonzept zu verändern. Erde, Licht, Matthäus 5,14 und die beiden Wege „Eine Stunde übernehmen“ und „Gebetswache starten“ bleiben die zentralen Elemente. Auch der anschließende Erklärteil und die mehrsprachige Ausspielung bleiben erhalten.

Die Modernisierung verfolgt vier Ergebnisse:

1. Der Hero wirkt wie eine bewusst inszenierte Bühne statt wie zentriert übereinanderliegende Einzelelemente.
2. Die Typografie erhält eine klare Hierarchie; die Marke bleibt kontemplativ und nicht werblich laut.
3. Der Erklärteil schließt visuell an den Hero an und zeigt das Produktprinzip verständlicher.
4. Statische Inhalte funktionieren sofort und ohne JavaScript; der interaktive Globus ist eine progressive Erweiterung.

Nicht Teil der Umsetzung sind ein Frameworkwechsel, ein obligatorischer WebGL-/Three.js-Umbau, Scroll-Jacking, neue Marketing-Inhaltsblöcke, ein verändertes Buchungskonzept oder eine Echtzeit-Infrastruktur per WebSocket/SSE. WebGL wird nur in einem separaten Vorhaben erwogen, falls die optimierte Canvas nachweislich nicht die freigegebene Wirkung oder Performance erreicht.

## 2. Ausgangslage und verbindliche Bestandteile

- `src/app/[locale]/landing-client.tsx` enthält derzeit Header, Hero, Globus, CTAs und Footer in einer Client-Komponente.
- `src/app/[locale]/page.tsx` rendert die SEO-relevanten Erklär-, Schritt- und FAQ-Inhalte bereits serverseitig.
- `src/components/patterns/Globe.tsx` implementiert die Erde mit Canvas 2D, lokalen NASA-Texturen, Drag, Fokusflug und Lichtverbindungen.
- Fraunces und DM Sans werden bereits über `next/font` eingebunden. Die semantischen Farb-Tokens und Reduced-Motion-Grundregeln aus `src/app/globals.css` bleiben die Basis.
- Deutsch, Englisch, Spanisch, Hebräisch und Arabisch einschließlich RTL müssen weiterhin funktionieren.
- Die beiden bisherigen CTA-Ziele und die cookiefreie Funnel-Messung bleiben unverändert.

## 3. Visuelles Design

### 3.1 Hero als atmosphärische Bühne

Der zentrierte Aufbau und die dunkle „Nachtwache“-Welt bleiben erhalten. Der Hintergrund erhält eine viewportübergreifende, ruhige Tiefenstaffelung:

- dunkles Blau-Schwarz als Basis, abgeleitet aus den bestehenden Farb-Tokens;
- dezenter radialer Atmosphären- und Morgenrot-Glow um die Erde;
- wenige Sterne unterschiedlicher Helligkeit statt eines gleichmäßigen Partikelfeldes;
- ein feines, statisches und lokal gespeichertes Korn ohne sichtbare Kachelung;
- keine Glassmorphism-Karten, leuchtenden Verläufe auf Text oder konkurrierenden Lichteffekte.

Die Erde bleibt das größte visuelle Objekt. Atmosphäre, Sterne und Korn sind sekundär und dürfen weder Textkontrast noch Klickziele beeinträchtigen. Der Header bleibt schmal und ruhig. Auf kleinen oder niedrigen Viewports darf die Seite natürlich scrollen; Inhalte werden nicht durch feste Höhen abgeschnitten.

### 3.2 Typografie und CTA-Hierarchie

Die H1 wird zur klaren textlichen Hauptebene:

- fluide Display-Größe `clamp(2.5rem, 4.5vw, 4rem)` mit sprachspezifischer Prüfung der Zeilenumbrüche;
- Fraunces mit sinnvoll genutzten optischen Achsen und ausgewogenem Zeilenumbruch über `text-wrap: balance`;
- kurze, auf zwei bis drei Zeilen austarierte Textbreite statt maximaler Zeilenlänge;
- Sprach- und RTL-spezifische Prüfung der Fallback-Schriften, Zeilenhöhen und Wortzwischenräume.

Der Bibelvers bleibt als goldene Bildunterschrift der Erde erhalten. Vers, Quellenangabe, H1 und CTAs werden durch Abstände und Größe als eine Komposition geführt.

Der primäre CTA „Eine Stunde übernehmen“ bleibt visuell dominant; „Gebetswache starten“ bleibt der sekundäre Umriss-Button. Darunter erscheint der vorhandene Text „Kein Account nötig zum Mitmachen“ als gut lesbarer Vertrauenshinweis. Es gibt keinen dritten konkurrierenden Haupt-CTA.

Footer- und Metatexte bleiben unaufdringlich, erreichen aber ausreichenden Kontrast und eine lesbare Mindestgröße. Deckkraft allein wird nicht verwendet, um Textkontraste abzusenken.

### 3.3 Motion

Motion folgt dem Prinzip „Die Seite atmet, sie zappelt nicht“:

- einmalige, kurze Eingangssequenz aus Erde, Text und CTAs;
- ausschließlich Opacity und kleine Translationen für UI-Eintritte;
- keine gleichzeitig pulsierenden Bedienelemente und keine Animation, die den Einstieg verzögert;
- die vorhandene langsame Globus-Rotation bleibt die einzige dauerhafte Ambient-Bewegung;
- kein Scroll-Jacking und keine notwendige Parallax-Interaktion.

Bei `prefers-reduced-motion: reduce` sind Poster, Text und CTAs sofort sichtbar. Rotation, Flug und Eingangssequenz entfallen; Auswahl und Navigation bleiben vollständig nutzbar.

### 3.4 Übergang und Erklärteil

Hero und Erklärteil werden als zusammenhängende Seite gestaltet:

- Im Light Theme vermittelt ein ruhiger Übergang von Nacht zu warmem Morgenlicht.
- Im Dark Theme bleibt der untere Bereich dunkel und erhält lediglich eine subtil veränderte Flächen- und Lichtführung.
- Die drei vorhandenen Schritte bleiben inhaltlich unverändert. Auf breiten Viewports erscheinen sie als verbundene Sequenz, auf Mobilgeräten untereinander.
- Ein kleines statisches ChainBand visualisiert Kontinuität und dient als ausdrücklich gekennzeichnete Produktminiatur ohne scheinbar live gezählte Buchungen.
- Die vorhandenen FAQ werden mit nativen `<details>`- und `<summary>`-Elementen kompakt zugänglich. Die JSON-LD-Daten bleiben bestehen.
- Die internen Links zu Wachen und Ratgeber bleiben erhalten und werden in dasselbe Abstands- und Typografiesystem integriert.

## 4. Komponenten- und Rendering-Architektur

### 4.1 Serverseitige Grundlage

`src/app/[locale]/page.tsx` komponiert künftig die gesamte statische Landing-Page einschließlich H1, Bibelvers, CTAs, Erklärteil und Footer. Header- und Footer-Bestandteile mit Interaktion, etwa `UserMenu`, `LocaleToggle` und `FeedbackDialog`, bleiben kleine Client-Komponenten innerhalb dieser Server-Komposition.

Die heutige große `LandingClient`-Verantwortung wird auf die interaktive Globus-Erfahrung reduziert. Diese Client-Insel erhält serverseitig aufbereitete Texte und initiale öffentliche Statistikdaten als typisierte Props. Der vorhandene `useFunnelPing('landing')` wird genau einmal aus einer auf der Landing-Page montierten Client-Insel ausgelöst.

Dadurch erscheinen Aussage, CTAs und Erklärinhalte bereits im HTML und sind ohne JavaScript nutzbar. Es findet kein Framework- oder Routingwechsel statt.

### 4.2 Poster und progressive Globus-Erweiterung

Ein statisches, optimiertes Erden-Poster ist die initiale Darstellung:

- responsives AVIF/WebP mit geeignetem Fallback und festen Abmessungen zur Vermeidung von Layout Shift;
- Priorisierung als wahrscheinliches LCP-Element;
- dekorativer Alternativtext, weil H1 und zugängliche Alternativdarstellung die Bedeutung bereits vermitteln;
- keine erfundenen Gebetslichter im Poster.

Die Canvas-Logik lädt als separate Client-Insel und übernimmt erst nach erfolgreicher Initialisierung die sichtbare Darstellung. Poster und Canvas belegen denselben reservierten Bereich. Bei fehlendem JavaScript, Fehlern beim Laden oder ungeeigneter Canvas-Unterstützung bleibt das Poster sichtbar; Text und CTAs sind davon unabhängig.

Die vorhandenen Erdtexturen werden in modernen Formaten bereitgestellt, mit JPEG-Fallback. Nur tatsächlich benötigte Ressourcen werden vorgeladen. `ResizeObserver` ersetzt die einmalige Größenmessung, damit sich die Darstellung bei Viewport- und Layoutänderungen korrekt anpasst.

### 4.3 Render-Loop und Datenaktualisierung

Texturen, Geometrie und Interaktionszustand werden von der Aktualisierung öffentlicher Statistikdaten getrennt. Eine neue `points`-Referenz oder eine veränderte Zahl aktiver Wachen darf weder Texturen neu laden noch Rotation und Nutzerfokus zurücksetzen.

Der Render-Loop:

- pausiert bei verborgenem Dokument und außerhalb des sichtbaren Bereichs;
- zeichnet bei Reduced Motion nur bei Daten-, Größen- oder Auswahländerungen;
- begrenzt weiterhin Display-Auflösung und Bildwiederholrate auf mobilen Geräten;
- verwirft veraltete asynchrone Ladephasen nach einem Unmount;
- erhält Drag- und Fokuszustand bei normalen Statistikaktualisierungen.

## 5. Datenfluss und Fehlerverhalten

`src/lib/api-server.ts` erhält einen typisierten, anonymen Abruf für `/stats/public`, der die vorhandenen Regeln für Timeout und Fehlertoleranz sowie eine Revalidierung von 60 Sekunden nutzt. Die Landing-Page übergibt das Ergebnis als `initialStats` an die Globus-Insel. Ein API-Fehler darf den Server-Render nicht scheitern lassen.

Die Client-Insel aktualisiert die Daten alle 60 Sekunden, jedoch nur bei sichtbarem Dokument. Nach einem fehlgeschlagenen Refresh bleibt der letzte gültige Stand erhalten. Es gibt keine blockierende Ladeanzeige und keinen Fehler-Toast für diese dekorative Zusatzinformation.

Ohne gültige Daten werden Erde und Atmosphäre weiterhin dargestellt, aber keine Gebetslichter oder Verbindungen vorgetäuscht. Die bisherigen `FALLBACK_POINTS` und der angenommene Standardwert von fünf aktiven Wachen entfallen. Falls zu Demonstrationszwecken später erneut Beispieldaten gezeigt werden, müssen sie sichtbar als solche gekennzeichnet sein.

Der Server-Cache und die bestehende API-TTL bleiben ausreichend; SSE oder WebSockets werden für diese niedrigfrequente Information nicht eingeführt.

## 6. Barrierefreiheit der Globus-Interaktion

Die Canvas bleibt gegenüber assistiven Technologien dekorativ. Eine dezent ausklappbare, semantische DOM-Liste „Lichter als Liste anzeigen“ bildet dieselben verfügbaren Gebetsorte ab und bietet eine gleichwertige Auswahl unabhängig von Zeigen, Drag oder Sichtbarkeit auf der Kugel.

- Alle Aktionen sind per Tastatur erreichbar und besitzen sichtbare Fokuszustände.
- Klick-, Listen- und Schließziele haben mindestens 44 × 44 CSS-Pixel.
- Die vorhandene Detailkarte zeigt Titel beziehungsweise Datenschutz-Hinweis, Ort, Anzahl und gegebenenfalls den Link zur öffentlichen Wache.
- `Escape` schließt die Detailkarte; nach einer Tastaturinteraktion kehrt der Fokus zum auslösenden Element zurück.
- Private Wachen geben weiterhin keine nichtöffentlichen Informationen preis.
- Die Liste aktualisiert sich aus demselben Datenstand wie die Canvas und erzeugt keine zusätzlichen API-Anfragen.

## 7. Qualitätskriterien und Verifikation

Die Umsetzung ist erst abgeschlossen, wenn folgende Punkte auf dem tatsächlichen Ergebnis geprüft sind:

### Funktional

- Beide CTAs, Header-Menüs, Sprachwechsel, Feedback, Impressum, Datenschutz und interne Links funktionieren wie zuvor.
- Poster, H1, Vers, CTAs und Erklärteil sind ohne JavaScript sichtbar und benutzbar.
- API-Ausfall, Texturfehler und Canvas-Fehler verändern weder Aussage noch Handlungswege.
- Reale Globusdaten überstehen einen Refresh ohne sichtbaren Reset; fehlgeschlagene Refreshes behalten den letzten gültigen Stand.
- Ohne Live-Daten erscheinen keine unmarkierten Beispiellichter.

### Visuell und responsiv

- Prüfung mindestens bei 390 px Mobilbreite, 1440 × 900 px Desktop und einem niedrigen Landscape-Viewport.
- Deutsch, Englisch, Spanisch, Hebräisch und Arabisch werden auf Zeilenumbruch, CTA-Breite, Fallback-Fonts und RTL geprüft.
- Light/Dark-Übergang, Fokuskontraste, Reduced Motion und 200-%-Zoom werden manuell kontrolliert.
- Keine Überlappung von Poster, Canvas, Detailkarte, H1 oder CTAs und kein messbarer Layout Shift beim Wechsel zur Canvas.

### Barrierefreiheit und Technik

- Vollständige Tastaturprüfung einschließlich Listenalternative, Detailkarte und Fokusrückkehr.
- Automatisierter Accessibility-Scan plus Screenreader-Stichprobe für Liste und Detailkarte.
- Bestehende Vitest-/Testing-Library-Suite ergänzen für Daten-Fallbacks, Sichtbarkeits-Polling, Reduced Motion und die zugängliche Auswahl; dazu `npm test`, `npm run lint` und `npm run build` ausführen.
- Lighthouse- und reale Geräteprüfung auf einem mobilen Mittelklassegerät. Zielwerte am 75. Perzentil: LCP unter 2,5 s, INP unter 200 ms und CLS unter 0,1.
- Keine anhaltende Render-Schleife bei verborgener Seite oder statischer Reduced-Motion-Darstellung.

## 8. Umsetzungsreihenfolge

1. Hero-Komposition, Typografie, CTA-Vertrauenshinweis und Übergang zum Erklärteil.
2. Server/Client-Trennung, optimiertes Poster und moderne Texturen.
3. Render-Loop-, Resize- und Datenaktualisierung ohne Szenen-Reset.
4. Zugängliche Listenalternative und Detailkarten-Interaktion.
5. Mehrsprachige, visuelle, technische und Barrierefreiheits-Verifikation auf realen Viewports.

Jede Stufe behält eine vollständig benutzbare Landing-Page bei. Sichtbare Designentscheidungen werden anhand des gerenderten Ergebnisses abgenommen, nicht allein anhand von Code oder Build-Ausgaben.
