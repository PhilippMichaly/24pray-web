/**
 * Strukturierte Daten (schema.org) als JSON-LD.
 *
 * In den Daten stecken Nutzer-Inhalte (Wachen-Titel, Anliegen, Namen). Ein `</script>` darin
 * würde den Block sonst vorzeitig schließen und alles Folgende zu ausführbarem Markup machen —
 * deshalb wird `<` konsequent escaped. JSON.stringify allein reicht dafür NICHT.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
