// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';
import type { ProjectWithStats } from '@/types';
import type { SlotViewModel } from '@/components/slots/types';

const base: ProjectWithStats = {
  id: 'p1',
  title: 'Nachtgebet für die Stadt',
  status: 'ACTIVE',
  visibility: 'PUBLIC',
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-07-08T00:00:00.000Z',
  timezone: 'UTC',
  slotDurationMinutes: 60,
  inviteToken: 'tok',
  organizerId: 'org-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  totalSlots: 24,
  bookedSlots: 0,
  organizerName: 'Ruth',
};

const bookedModel: SlotViewModel = {
  key: '2026-07-01T00:00:00.000Z',
  slotId: 'slot-1',
  startTime: '2026-07-01T00:00:00.000Z',
  endTime: '2026-07-01T01:00:00.000Z',
  isMine: false,
  userName: 'Maria',
  status: 'BOOKED',
  isNight: false,
  isLargestGap: false,
  state: 'BOOKED',
};

describe('ProjectCard — erzählt das Anliegen (P3)', () => {
  afterEach(() => cleanup());

  it('zeigt die Beschreibung zweizeilig, wenn vorhanden', () => {
    render(<ProjectCard project={{ ...base, description: 'Wir beten für Frieden in der Stadt.' }} models={[]} />);
    expect(screen.getByText('Wir beten für Frieden in der Stadt.')).toBeTruthy();
  });

  it('lässt die Beschreibung weg, wenn leer/undefined', () => {
    render(<ProjectCard project={{ ...base, description: undefined }} models={[]} />);
    expect(screen.queryByText(/beten/i)).toBeNull();
  });

  it('Status-Badge fehlt bei ACTIVE (Standard sagt nichts), erscheint bei PAUSED (Abweichung)', () => {
    const { rerender } = render(<ProjectCard project={base} models={[]} />);
    expect(screen.queryByText('Aktiv')).toBeNull();
    rerender(<ProjectCard project={{ ...base, status: 'PAUSED' }} models={[]} />);
    expect(screen.getByText('Pausiert')).toBeTruthy();
  });

  it('Mini-Band nur wenn bookedSlots > 0 (leere Pixelreihen wären Rauschen)', () => {
    const { container, rerender } = render(<ProjectCard project={{ ...base, bookedSlots: 0 }} models={[bookedModel]} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    rerender(<ProjectCard project={{ ...base, bookedSlots: 1 }} models={[bookedModel]} />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('Meta-Zeile zeigt Ort (wenn vorhanden) und das Enddatum kurz', () => {
    render(<ProjectCard project={{ ...base, locationName: 'Berlin' }} models={[]} />);
    expect(screen.getByText(/Berlin/)).toBeTruthy();
    expect(screen.getByText(/bis/)).toBeTruthy();
  });

  it('Meta-Zeile ohne Ort zeigt nur das Enddatum, ohne führenden Trenner', () => {
    render(<ProjectCard project={{ ...base, locationName: undefined }} models={[]} />);
    expect(screen.queryByText(/^·/)).toBeNull();
  });
});
