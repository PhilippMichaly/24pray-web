// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
}));

const deleteProject = vi.fn();
vi.mock('@/lib/api', () => ({ deleteProject: (...a: unknown[]) => deleteProject(...a) }));

import { ProjectDangerZone } from './ProjectDangerZone';

describe('ProjectDangerZone — wk-Wache löschen (Ersteller-Lebenszyklus)', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.clearAllMocks());

  it('Bestätigung nennt Konsequenzen, Bestätigen ruft DELETE über deleteProject und leitet auf /dashboard weiter', async () => {
    deleteProject.mockResolvedValueOnce(undefined);
    render(<ProjectDangerZone projectId="p1" />);

    expect(screen.getByText(/informiert.*rückgängig|notified.*undone/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Wache löschen|Delete watch/i }));

    await waitFor(() => expect(screen.getByText(/Bist du sicher|Are you sure/i)).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /endgültig löschen|permanently delete/i }));

    await waitFor(() => expect(deleteProject).toHaveBeenCalledWith('p1'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });

  it('Abbrechen im Bestätigungs-Schritt löscht nicht', () => {
    render(<ProjectDangerZone projectId="p1" />);
    fireEvent.click(screen.getByRole('button', { name: /Wache löschen|Delete watch/i }));
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen|Cancel/i }));
    expect(deleteProject).not.toHaveBeenCalled();
  });
});
