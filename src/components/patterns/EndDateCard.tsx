'use client';

import { useEffect, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import { updateProjectEnd } from '@/lib/api';
import type { ProjectWithStats } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FieldError, Label } from '@/components/ui/Label';
import { toast } from '@/components/ui/toast-store';
import { t, tUnit } from '@/lib/i18n';
import { browserTz, formatDateTimeShort, toDateTimeLocalValue } from '@/lib/time';
import { validateCustomEnd } from '@/lib/end-validation';
import { isApiError } from '@/lib/api-error';

// PD-05: Fehlercodes des API-Vertrags aus 02-01 (PATCH /projects/:id mit endDate). Erkannt wird nur
// über diese Codes, nie über den Meldungstext (I-8). Ein Umbenennen braucht eine koordinierte
// Änderung in API und Web; D-05: die API wird vor dem Web deployt.
const END_CUTS_BOOKING = 'END_CUTS_BOOKING';
const END_NOT_ALIGNED = 'END_NOT_ALIGNED';
const END_NOT_AFTER_START = 'END_NOT_AFTER_START';
const SPAN_TOO_LONG = 'SPAN_TOO_LONG';

/** ISO-String aus dem Fehler-Body nur übernehmen, wenn er zu einem gültigen Datum parst (T-02-07). */
function validIso(v: unknown): string | null {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null;
}

/**
 * Ende der Wache verlängern oder verkürzen — nur Organisator.
 * U-1/PD-02: bewusst eine eigene Karte neben ScheduleCard. Verschieben bewegt Buchungen und
 * verschickt Mails; Ende ändern verschiebt nichts und mailt nicht — getrennte Karten verhindern,
 * dass die Mail-Warnung des Verschiebens für das Ende gelesen wird.
 * Den Buchungsschutz prüft der Server verbindlich (D-01, 409); das Raster lädt nach Erfolg über
 * onUpdated → setProject automatisch neu (I-7).
 */
export function EndDateCard({
  project,
  onUpdated,
  dayMode,
  onConflict,
}: {
  project: ProjectWithStats;
  onUpdated: (p: ProjectWithStats) => void;
  dayMode: boolean;
  /** I-8: nach 409 END_CUTS_BOOKING — der Aufrufer lädt das Raster neu. */
  onConflict?: () => void;
}) {
  const currentValue = toDateTimeLocalValue(new Date(project.endDate));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(currentValue);
  const [error, setError] = useState<string | null>(null);
  // Fokusziel nach dem nächsten Render: Feld beim Öffnen (I-1), CTA nach Abbrechen/Erfolg (I-7, I-11).
  const [focusTarget, setFocusTarget] = useState<'input' | 'cta' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusTarget === 'input') inputRef.current?.focus();
    if (focusTarget === 'cta') ctaRef.current?.focus();
    if (focusTarget) setFocusTarget(null);
  }, [focusTarget, editing]);

  // PD-01: Sekundenrest alter Startzeiten. Validiert wird gegen den minutengenauen Start, gesendet
  // wird der getippte Wert plus Rest — so ist jedes minutengenau getippte Raster-Ende gültig.
  const startMs = Date.parse(project.startDate);
  const residue = startMs % 60_000;

  /**
   * I-4 (Client-Teil): gleiche Regeln und Texte wie das Erstellungsformular (D-07).
   * Leerer String deckt auch die Teil-Eingabe ab — dafür liefert der Browser ''.
   */
  function validate(v: string): string | null {
    if (!v) return t('errEndMissing');
    const result = validateCustomEnd(
      startMs - residue,
      new Date(v).getTime(),
      project.slotDurationMinutes * 60_000,
    );
    if (!result) return null;
    switch (result.key) {
      case 'notAfterStart':
        return t('errEndAfterStart');
      case 'tooLong':
        return t('errEndTooLong');
      case 'notAligned':
        // D-13/PD-01: konkretes nächstmögliches Ende als Hinweis — der Wert selbst wird nie ersetzt (D-06).
        return t('errEndNotAligned', {
          example: formatDateTimeShort(new Date(result.exampleMs!).toISOString(), browserTz()),
        });
      default:
        return t('errEndMissing');
    }
  }

  /**
   * I-8/I-9: bekannte Server-Codes → derselbe lokalisierte Feldtext wie bei der Client-Prüfung.
   * null → kein Feldfehler möglich (unbekannter Code, fehlende/ungültige Datumsfelder) → Toast (I-10).
   */
  function serverFieldError(e: unknown): string | null {
    if (!isApiError(e)) return null;
    switch (e.code) {
      case END_CUTS_BOOKING: {
        const earliest = validIso(e.data?.earliestEnd);
        return earliest
          ? tUnit(dayMode, 'errEndCutsBooking', 'errEndCutsBookingDays', {
              earliest: formatDateTimeShort(earliest, browserTz()),
            })
          : null;
      }
      case END_NOT_ALIGNED: {
        const example = validIso(e.data?.exampleEnd);
        return example
          ? t('errEndNotAligned', { example: formatDateTimeShort(example, browserTz()) })
          : null;
      }
      case END_NOT_AFTER_START:
        return t('errEndAfterStart');
      case SPAN_TOO_LONG:
        return t('errEndTooLong');
      default:
        return null;
    }
  }

  function open() {
    setValue(currentValue);
    setError(null);
    setEditing(true);
    setFocusTarget('input');
  }

  function close() {
    setValue(currentValue);
    setError(null);
    setEditing(false);
    setFocusTarget('cta');
  }

  async function save() {
    // I-3/I-5: Prüfung beim Speichern — bei Verstoß kein Request, Fokus zurück ins Feld.
    const clientError = validate(value);
    if (clientError) {
      setError(clientError);
      setFocusTarget('input');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      // PD-01: Sekundenrest alter Startzeiten unsichtbar mitführen, damit die Spanne exakt auf dem
      // Raster bleibt. Der eingegebene Minutenwert bleibt unverändert — kein Runden (D-06).
      const endIso = new Date(new Date(value).getTime() + residue).toISOString();
      const updated = await updateProjectEnd(project.id, endIso);
      onUpdated(updated);
      setEditing(false);
      setFocusTarget('cta');
      toast({
        message: t('endSaved', { date: formatDateTimeShort(updated.endDate, browserTz()) }),
        variant: 'positive',
      });
    } catch (e) {
      // Edit-Modus und eingegebener Wert bleiben in jedem Fall (D-06, I-10).
      const fieldError = serverFieldError(e);
      if (fieldError) {
        // U-2: Feldfehler statt Toast, Fokus ins Feld.
        setError(fieldError);
        setFocusTarget('input');
        // I-8: Raster neu laden, damit die Client-Vorprüfung (02-03) wieder stimmt.
        if (isApiError(e) && e.code === END_CUTS_BOOKING) onConflict?.();
      } else {
        toast({ message: (e as Error).message, variant: 'danger' });
      }
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <Card elevation={1} className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Flag size={18} className="shrink-0 text-accent-strong" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{t('endCardTitle')}</p>
            {/* PD-03: umbrechen statt abschneiden — das Datum muss bei 390px vollständig sichtbar sein. */}
            <p className="break-words text-xs text-ink-muted">
              {t('endCardCurrentEnd', { date: formatDateTimeShort(project.endDate, browserTz()) })}
            </p>
          </div>
        </div>
        <Button ref={ctaRef} size="sm" variant="secondary" className="shrink-0" onClick={open}>
          {t('endCardCta')}
        </Button>
      </Card>
    );
  }

  return (
    <Card elevation={1} className="space-y-3">
      <p className="text-sm font-medium text-ink">{t('endCardTitle')}</p>
      <div>
        <Label htmlFor="project-new-end">{t('endNewEndLabel')}</Label>
        {/* D-06: kein min/max/step — die Ausrichtung wird validiert, nicht vom Browser erzwungen. */}
        <Input
          ref={inputRef}
          id="project-new-end"
          type="datetime-local"
          invalid={!!error}
          aria-describedby={error ? 'project-new-end-hint project-new-end-error' : 'project-new-end-hint'}
          value={value}
          // I-3: Tippen ändert nur den Wert; geprüft wird bei Blur und beim Speichern.
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setError(validate(value))}
        />
        <FieldError id="project-new-end-error">{error}</FieldError>
      </div>
      <div id="project-new-end-hint" className="space-y-1">
        <p className="text-sm text-ink-muted">{tUnit(dayMode, 'endEditHint', 'endEditHintDays')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* I-2: unverändertes Ende → kein Request, kein Toast. */}
        <Button size="sm" loading={saving} disabled={value === currentValue} onClick={save}>
          {t('endConfirmButton')}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={close}>
          {t('cancel')}
        </Button>
      </div>
    </Card>
  );
}
