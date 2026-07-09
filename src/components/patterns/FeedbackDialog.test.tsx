// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock('@/lib/api', () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { FeedbackDialog } from './FeedbackDialog';

describe('FeedbackDialog (User-Zusatzpunkt)', () => {
  beforeEach(() => { cleanup(); post.mockClear(); });

  it('öffnet, sendet Feedback mit optionaler Mail, zeigt Danke + GitHub-Link', async () => {
    render(<FeedbackDialog />);
    fireEvent.click(screen.getByRole('button', { name: /feedback/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /feedback|nachricht/i }), {
      target: { value: 'un9: Der Kalender-Knopf tut nichts.' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /antwort|e-mail/i }), {
      target: { value: 'un9-user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /absenden|senden/i }));
    await waitFor(() => expect(screen.getByText(/danke/i)).toBeTruthy());
    expect(post).toHaveBeenCalledWith('/feedback', expect.objectContaining({
      message: 'un9: Der Kalender-Knopf tut nichts.',
      email: 'un9-user@example.com',
    }));
    const gh = screen.getByRole('link', { name: /github/i }) as HTMLAnchorElement;
    expect(gh.href).toContain('github.com/PhilippMichaly/24pray-web');
  });

  it('leere optionale Mail wird nicht mitgesendet', async () => {
    render(<FeedbackDialog />);
    fireEvent.click(screen.getByRole('button', { name: /feedback/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /feedback|nachricht/i }), {
      target: { value: 'un9 nur Text, lang genug.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /absenden|senden/i }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    const body = post.mock.calls[0][1] as Record<string, unknown>;
    expect(body.email).toBeUndefined();
  });
});
