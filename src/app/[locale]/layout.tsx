import { notFound } from 'next/navigation';
import { parseLocale } from '@/lib/i18n';

/**
 * Sprachsegment aller öffentlichen, indexierbaren Seiten.
 *
 * `/[locale]` ist ein dynamisches Segment auf oberster Ebene und würde sonst jeden
 * unbekannten Pfad schlucken (`/foo` → locale='foo'). Statische Routen wie /dashboard
 * gewinnen zwar gegen das dynamische Segment, alles Übrige muss hier hart abgewiesen
 * werden — sonst antwortet die Seite mit 200 auf beliebigen Müll und Google indexiert ihn.
 *
 * Die Sprache fürs Rendering kommt NICHT von hier, sondern über den `x-locale`-Header der
 * Middleware ins Root-Layout (das sitzt über diesem Segment und setzt `<html lang>`/`dir`).
 */
export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!parseLocale(params.locale)) notFound();
  return <>{children}</>;
}
