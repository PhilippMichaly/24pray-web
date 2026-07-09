// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { LandingStats } from './LandingStats';

describe('LandingStats — Schwellwert-Logik (Backlog 2)', () => {
  beforeEach(() => cleanup());

  it('unter 5 kumulierten Stunden: gar nichts (Kaltstart)', () => {
    const { container } = render(<LandingStats completedHours={4.9} activeChains={20} />);
    expect(container.textContent).toBe('');
  });

  it('ab 5 Stunden: kumulative Zahl (gerundet), Live-Zahl unter Schwelle bleibt weg', () => {
    const { container } = render(<LandingStats completedHours={127.6} activeChains={4} />);
    expect(container.textContent).toContain('128');
    expect(container.textContent).toContain('gemeinsam gebetet');
    expect(container.textContent).not.toContain('laufen gerade');
  });

  it('ab 5 aktiven Wachen zusätzlich die Live-Zahl', () => {
    const { container } = render(<LandingStats completedHours={128} activeChains={7} />);
    expect(container.textContent).toContain('gemeinsam gebetet');
    expect(container.textContent).toContain('7');
    expect(container.textContent).toContain('laufen gerade');
  });
});
