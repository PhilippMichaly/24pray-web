// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import type { ProjectWithStats } from '@/types';

const shiftProject = vi.fn();
vi.mock('@/lib/api', () => ({ shiftProject: (...a: unknown[]) => shiftProject(...a) }));

import { ScheduleCard } from './ScheduleCard';

const base = {
  id: 'p1',
  title: 'K',
  startDate: '2026-08-01T10:00:00.000Z',
  endDate: '2026-08-02T10:00:00.000Z',
} as ProjectWithStats;

describe('ScheduleCard — wk-Wache verschieben (Ersteller-Lebenszyklus)', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  it('zeigt den aktuellen Start und einen CTA', () => {
    render(<ScheduleCard project={base} onUpdated={vi.fn()} />);
    expect(screen.getByText(/Zeitplan/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Verschieben/i })).toBeTruthy();
  });

  it('Edit zeigt Erklärung + datetime-local-Feld, Speichern ruft shiftProject mit ISO-Datum', async () => {
    const onUpdated = vi.fn();
    const updated = { ...base, startDate: '2026-08-03T09:30:00.000Z' };
    shiftProject.mockResolvedValueOnce(updated);
    render(<ScheduleCard project={base} onUpdated={onUpdated} />);

    fireEvent.click(screen.getByRole('button', { name: /Verschieben/i }));
    expect(screen.getByText(/verschieben sich entsprechend/i)).toBeTruthy();

    const input = screen.getByLabelText(/Neuer Start/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2026-08-03T09:30' } });
    fireEvent.click(screen.getByRole('button', { name: /informieren/i }));

    await waitFor(() => expect(shiftProject).toHaveBeenCalledTimes(1));
    const [id, newStartDate] = shiftProject.mock.calls[0];
    expect(id).toBe('p1');
    expect(new Date(newStartDate).getTime()).toBe(new Date('2026-08-03T09:30').getTime());
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
  });

  it('Fehler beim Speichern zeigt Toast, kein onUpdated', async () => {
    shiftProject.mockRejectedValueOnce(new Error('Nur der Organisator darf die Wache verschieben'));
    const onUpdated = vi.fn();
    render(<ScheduleCard project={base} onUpdated={onUpdated} />);
    fireEvent.click(screen.getByRole('button', { name: /Verschieben/i }));
    fireEvent.click(screen.getByRole('button', { name: /informieren/i }));
    await waitFor(() => expect(shiftProject).toHaveBeenCalled());
    expect(onUpdated).not.toHaveBeenCalled();
  });
});
