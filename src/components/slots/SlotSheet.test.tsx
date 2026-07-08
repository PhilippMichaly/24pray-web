// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { SlotSheet } from './SlotSheet';
import type { SlotViewModel } from './types';
import type { ProjectWithStats } from '@/types';

const project = {
  id: 'p-1',
  title: 'Testkette',
  timezone: 'UTC',
  startDate: '2099-01-01T00:00:00.000Z',
  endDate: '2099-01-03T00:00:00.000Z',
} as ProjectWithStats;

const bookedSlot: SlotViewModel = {
  key: '2099-01-01T10:00:00.000Z',
  slotId: 'slot-1',
  startTime: '2099-01-01T10:00:00.000Z',
  endTime: '2099-01-01T11:00:00.000Z',
  isMine: false,
  userName: 'Maria S.',
  status: 'BOOKED',
  isNight: false,
  isLargestGap: false,
  state: 'BOOKED',
};

function renderSheet(over: Partial<Parameters<typeof SlotSheet>[0]> = {}) {
  return render(
    <SlotSheet
      open
      onOpenChange={() => {}}
      slot={bookedSlot}
      project={project}
      mode="info"
      {...over}
    />,
  );
}

describe('SlotSheet info-Modus — Storno für Gast und Organisator (F2)', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('zeigt ohne Token und ohne Organisator-Rolle keinen Storno-Button', () => {
    renderSheet();
    expect(screen.queryByRole('button', { name: 'Stunde freigeben' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Buchung entfernen' })).toBeNull();
  });

  it('Gast mit gespeichertem Token: Storno-Button, Bestätigung ruft onCancel mit Token und räumt den Token weg', async () => {
    localStorage.setItem('24pray:guest:slot-1', 'tok-123');
    const onCancel = vi.fn().mockResolvedValue(undefined);
    renderSheet({ onCancel });

    fireEvent.click(screen.getByRole('button', { name: 'Stunde freigeben' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stunde freigeben' })); // Bestätigen

    await waitFor(() => expect(onCancel).toHaveBeenCalledWith('tok-123'));
    expect(localStorage.getItem('24pray:guest:slot-1')).toBeNull();
  });

  it('Organisator ohne Token: „Buchung entfernen" ruft onCancel ohne Token', async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);
    renderSheet({ isOrganizer: true, onCancel });

    fireEvent.click(screen.getByRole('button', { name: 'Buchung entfernen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Buchung entfernen' }));

    await waitFor(() => expect(onCancel).toHaveBeenCalledWith(undefined));
  });

  it('vergangene Slots bleiben ohne Storno-Button', () => {
    localStorage.setItem('24pray:guest:slot-1', 'tok-123');
    renderSheet({ slot: { ...bookedSlot, state: 'PAST' }, isOrganizer: true });
    expect(screen.queryByRole('button', { name: 'Stunde freigeben' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Buchung entfernen' })).toBeNull();
  });
});

describe('SlotSheet Tages-Modus (dayMode, P3) — Titel/Zeitanzeige/Storno-Texte sagen Tag statt Stunde', () => {
  const dayProject = { ...project, slotDurationMinutes: 1440 } as ProjectWithStats;
  const daySlot: SlotViewModel = {
    ...bookedSlot,
    startTime: '2099-01-01T14:00:00.000Z',
    endTime: '2099-01-02T14:00:00.000Z',
  };

  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('info-Modus: Titel "Dieser Tag", Zeitanzeige zeigt ein Datum, kein "Uhr"-Suffix', () => {
    renderSheet({ project: dayProject, slot: daySlot });
    expect(screen.getByText('Dieser Tag')).toBeTruthy();
    expect(screen.queryByText(/Uhr/)).toBeNull();
    expect(screen.queryByText(/\d{2}–\d{2}/)).toBeNull();
  });

  it('mine-Modus: Titel "Dein Tag", Storno-Button sagt "Tag freigeben"', () => {
    renderSheet({ project: dayProject, slot: { ...daySlot, isMine: true, state: 'MINE' }, mode: 'mine' });
    expect(screen.getByText('Dein Tag')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tag freigeben' })).toBeTruthy();
  });

  it('info-Modus Organisator: "Buchung entfernen" -> Bestätigung sagt "Tag wird wieder frei"', async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);
    renderSheet({ project: dayProject, slot: daySlot, isOrganizer: true, onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'Buchung entfernen' }));
    expect(screen.getByText(/Der Tag wird wieder frei/)).toBeTruthy();
  });

  it('guest-book-Modus: Titel sagt "Tag übernehmen"', () => {
    renderSheet({ project: dayProject, slot: { ...daySlot, status: 'FREE', slotId: null }, mode: 'guest-book' });
    expect(screen.getByText('Tag übernehmen')).toBeTruthy();
  });
});
