// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AccountBenefits } from './AccountBenefits';

describe('AccountBenefits (Backlog 6)', () => {
  beforeEach(() => cleanup());

  it('zeigt Titel und drei Nutzen-Punkte', () => {
    render(<AccountBenefits />);
    expect(screen.getByText(/Mit einem Konto/i)).toBeTruthy();
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(3);
    expect(items.map((li) => li.textContent).join(' ')).toMatch(/Stunden/);
    expect(items.map((li) => li.textContent).join(' ')).toMatch(/Erinnerung/);
    expect(items.map((li) => li.textContent).join(' ')).toMatch(/Name/);
  });
});
