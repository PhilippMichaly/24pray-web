// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import type { ProjectWithStats } from '@/types';

const patch = vi.fn();
vi.mock('@/lib/api', () => ({ api: { patch: (...a: unknown[]) => patch(...a) } }));

import { ConcernCard } from './ConcernCard';

const base = { id: 'p1', title: 'K', description: null } as ProjectWithStats;

describe('ConcernCard — wb-Anliegen nachträglich editierbar (Punkt 9)', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  it('zeigt CTA, wenn keine Beschreibung gesetzt ist', () => {
    render(<ConcernCard project={base} onUpdated={vi.fn()} />);
    expect(screen.getByText(/Anliegen hinzufügen/i)).toBeTruthy();
  });

  it('zeigt die bestehende Beschreibung und erlaubt Bearbeiten + Speichern', async () => {
    const onUpdated = vi.fn();
    patch.mockResolvedValueOnce({ ...base, description: 'Neues Anliegen' });
    render(<ConcernCard project={{ ...base, description: 'Altes Anliegen' }} onUpdated={onUpdated} />);

    expect(screen.getByText('Altes Anliegen')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Bearbeiten/i }));

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '  Neues Anliegen  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Speichern/i }));

    await waitFor(() => expect(patch).toHaveBeenCalledWith('/projects/p1', { description: 'Neues Anliegen' }));
    await waitFor(() => expect(onUpdated).toHaveBeenCalled());
  });

  it('leere Beschreibung wird als null gespeichert', async () => {
    patch.mockResolvedValueOnce({ ...base, description: null });
    render(<ConcernCard project={{ ...base, description: 'Altes Anliegen' }} onUpdated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Bearbeiten/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Speichern/i }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/projects/p1', { description: null }));
  });
});
