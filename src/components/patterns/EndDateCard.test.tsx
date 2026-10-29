// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import type { ProjectWithStats } from '@/types';
import { browserTz, formatDateTimeShort, toDateTimeLocalValue } from '@/lib/time';

const updateProjectEnd = vi.fn();
vi.mock('@/lib/api', () => ({ updateProjectEnd: (...a: unknown[]) => updateProjectEnd(...a) }));

const toast = vi.fn();
vi.mock('@/components/ui/toast-store', () => ({ toast: (...a: unknown[]) => toast(...a) }));

import { EndDateCard } from './EndDateCard';

// Pitfall 9: Fixture aus Lokalzeit-Strings und ohne Zeitumstellung dazwischen (Januar) — DST-frei.
const base = {
  id: 'p1',
  title: 'K',
  startDate: new Date('2099-01-10T10:00').toISOString(),
  endDate: new Date('2099-01-11T10:00').toISOString(),
  slotDurationMinutes: 60,
} as ProjectWithStats;

const ctaBtn = () => screen.getByRole('button', { name: /Ende ändern/i });
const saveBtn = () => screen.getByRole('button', { name: /Ende speichern/i }) as HTMLButtonElement;
const cancelBtn = () => screen.getByRole('button', { name: /Abbrechen/i }) as HTMLButtonElement;
const field = () => screen.getByLabelText(/Neues Ende/i) as HTMLInputElement;

describe('EndDateCard — Ende der Wache ändern (EDIT-01)', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  it('(a) Anzeige zeigt Titel, CTA und das aktuelle Ende', () => {
    render(<EndDateCard project={base} onUpdated={vi.fn()} dayMode={false} />);
    expect(screen.getByText('Ende der Wache')).toBeTruthy();
    expect(ctaBtn()).toBeTruthy();
    expect(screen.getByText(new RegExp(formatDateTimeShort(base.endDate, browserTz())))).toBeTruthy();
  });

  it('(b) „Ende ändern“ öffnet Edit mit Fokus und vorbelegtem Ende; Speichern ist deaktiviert', () => {
    render(<EndDateCard project={base} onUpdated={vi.fn()} dayMode={false} />);
    fireEvent.click(ctaBtn());
    expect(document.activeElement).toBe(field());
    expect(field().value).toBe(toDateTimeLocalValue(new Date(base.endDate)));
    expect(saveBtn().disabled).toBe(true);
    expect(screen.getByText(/ganzen Stunden/)).toBeTruthy();
  });

  it('(c) Speichern ruft updateProjectEnd, meldet das Projekt, toastet positiv und schließt', async () => {
    const onUpdated = vi.fn();
    const updated = { ...base, endDate: new Date('2099-01-12T10:00').toISOString() };
    updateProjectEnd.mockResolvedValueOnce(updated);
    render(<EndDateCard project={base} onUpdated={onUpdated} dayMode={false} />);

    fireEvent.click(ctaBtn());
    fireEvent.change(field(), { target: { value: '2099-01-12T10:00' } });
    fireEvent.click(saveBtn());

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    expect(updateProjectEnd).toHaveBeenCalledTimes(1);
    expect(updateProjectEnd).toHaveBeenCalledWith('p1', new Date('2099-01-12T10:00').toISOString());
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'positive', message: expect.stringContaining('Ende geändert') }),
    );
    await waitFor(() => expect(ctaBtn()).toBeTruthy());
    expect(screen.queryByLabelText(/Neues Ende/i)).toBeNull();
    expect(document.activeElement).toBe(ctaBtn());
  });

  it('(d) während der Request läuft, sind Speichern und Abbrechen deaktiviert', async () => {
    updateProjectEnd.mockReturnValueOnce(new Promise(() => {}));
    render(<EndDateCard project={base} onUpdated={vi.fn()} dayMode={false} />);
    fireEvent.click(ctaBtn());
    fireEvent.change(field(), { target: { value: '2099-01-12T10:00' } });
    fireEvent.click(saveBtn());

    await waitFor(() => expect(saveBtn().disabled).toBe(true));
    expect(cancelBtn().disabled).toBe(true);
    fireEvent.click(saveBtn());
    expect(updateProjectEnd).toHaveBeenCalledTimes(1);
  });

  it('(e) Netzfehler → Danger-Toast mit Meldung, Edit-Modus und Wert bleiben', async () => {
    updateProjectEnd.mockRejectedValueOnce(new Error('Netz weg'));
    const onUpdated = vi.fn();
    render(<EndDateCard project={base} onUpdated={onUpdated} dayMode={false} />);
    fireEvent.click(ctaBtn());
    fireEvent.change(field(), { target: { value: '2099-01-12T10:00' } });
    fireEvent.click(saveBtn());

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger', message: 'Netz weg' })),
    );
    expect(onUpdated).not.toHaveBeenCalled();
    expect(field().value).toBe('2099-01-12T10:00');
    await waitFor(() => expect(saveBtn().disabled).toBe(false));
  });

  it('(f) Abbrechen verwirft die Änderung; erneutes Öffnen zeigt wieder das aktuelle Ende', () => {
    render(<EndDateCard project={base} onUpdated={vi.fn()} dayMode={false} />);
    fireEvent.click(ctaBtn());
    fireEvent.change(field(), { target: { value: '2099-01-12T10:00' } });
    fireEvent.click(cancelBtn());

    expect(screen.queryByLabelText(/Neues Ende/i)).toBeNull();
    expect(document.activeElement).toBe(ctaBtn());
    fireEvent.click(ctaBtn());
    expect(field().value).toBe(toDateTimeLocalValue(new Date(base.endDate)));
    expect(updateProjectEnd).not.toHaveBeenCalled();
  });

  it('(g) PD-01: Sekundenrest des Starts wird unsichtbar ins gespeicherte Ende übernommen', async () => {
    const withResidue = {
      ...base,
      startDate: new Date(new Date('2099-01-10T10:00').getTime() + 23_000).toISOString(),
      endDate: new Date(new Date('2099-01-11T10:00').getTime() + 23_000).toISOString(),
    } as ProjectWithStats;
    updateProjectEnd.mockResolvedValueOnce(withResidue);
    render(<EndDateCard project={withResidue} onUpdated={vi.fn()} dayMode={false} />);
    fireEvent.click(ctaBtn());
    fireEvent.change(field(), { target: { value: '2099-01-12T10:00' } });
    fireEvent.click(saveBtn());

    await waitFor(() => expect(updateProjectEnd).toHaveBeenCalledTimes(1));
    const sent = updateProjectEnd.mock.calls[0][1] as string;
    expect(sent).toBe(new Date(new Date('2099-01-12T10:00').getTime() + 23_000).toISOString());
    expect(new Date(sent).getSeconds()).toBe(23);
  });
});
