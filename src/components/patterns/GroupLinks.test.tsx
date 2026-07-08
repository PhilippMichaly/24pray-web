// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { GroupLinksBar } from './GroupLinksBar';
import type { ProjectWithStats } from '@/types';

const base = { id: 'p1', title: 'K' } as ProjectWithStats;

describe('GroupLinksBar — parallele Kommunikation (WhatsApp/Telegram/Signal)', () => {
  beforeEach(() => cleanup());

  it('rendert nur gesetzte Dienste mit korrektem Ziel und sicherem target', () => {
    render(
      <GroupLinksBar
        project={{ ...base, linkWhatsapp: 'https://chat.whatsapp.com/AbC', linkSignal: 'https://signal.group/#Xy' }}
      />,
    );
    const wa = screen.getByRole('link', { name: /WhatsApp/i });
    expect(wa.getAttribute('href')).toBe('https://chat.whatsapp.com/AbC');
    expect(wa.getAttribute('target')).toBe('_blank');
    expect(wa.getAttribute('rel')).toContain('noopener');
    expect(screen.getByRole('link', { name: /Signal/i })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Telegram/i })).toBeNull();
  });

  it('rendert nichts, wenn kein Link gesetzt ist', () => {
    const { container } = render(<GroupLinksBar project={base} />);
    expect(container.innerHTML).toBe('');
  });
});
