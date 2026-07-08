'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { geocodeCity, type GeoCity } from '@/lib/api';
import { matchCity } from '@/lib/cities';
import { t } from '@/lib/i18n';

/**
 * Orts-Autocomplete (W3.6): sucht weltweit über /geocode (GeoNames, alle
 * Sprachvarianten — „München" findet Munich). Fällt bei API-Fehlern auf die
 * eingebettete Städteliste zurück. Auswahl → onSelect(city); Tippen ohne
 * Auswahl → onSelect(null).
 */
export interface CityInputProps {
  id: string;
  initialName?: string;
  placeholder?: string;
  onSelect: (city: GeoCity | null) => void;
  compact?: boolean;
}

export function CityInput({ id, initialName, placeholder, onSelect, compact }: CityInputProps) {
  const [text, setText] = useState(initialName ?? '');
  const [selected, setSelected] = useState<GeoCity | null>(null);
  const [suggestions, setSuggestions] = useState<GeoCity[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  function choose(city: GeoCity) {
    setSelected(city);
    setText(city.name);
    setSuggestions([]);
    setOpen(false);
    onSelect(city);
  }

  function onChange(v: string) {
    setText(v);
    setSelected(null);
    onSelect(null);
    if (debounce.current) clearTimeout(debounce.current);
    const term = v.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const hits = await geocodeCity(term);
        if (hits.length > 0) {
          setSuggestions(hits);
          setOpen(true);
          return;
        }
      } catch {
        /* API down → Fallback unten */
      }
      const fallback = matchCity(term);
      setSuggestions(fallback ? [{ name: fallback.name, country: '', lat: fallback.lat, lon: fallback.lon }] : []);
      setOpen(!!fallback);
    }, 250);
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && open && suggestions[0]) {
            e.preventDefault();
            choose(suggestions[0]);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? t('fieldLocationPlaceholder')}
        autoComplete="off"
        className={compact ? 'py-2 text-sm' : undefined}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border bg-surface shadow-2">
          {suggestions.map((c, i) => (
            <li key={`${c.name}-${c.country}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // vor onBlur greifen
                  choose(c);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-ink hover:bg-accent-soft/50"
              >
                <MapPin size={13} className="shrink-0 text-accent-strong" aria-hidden />
                <span className="truncate">{c.name}</span>
                {c.country && <span className="ms-auto shrink-0 text-xs text-ink-muted">{c.country}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {text.trim().length >= 2 && (
        <p className={`mt-1 text-xs ${selected ? 'text-positive' : 'text-ink-muted'}`}>
          {selected ? t('locationMatched', { city: selected.name }) : t('locationPickHint')}
        </p>
      )}
    </div>
  );
}
