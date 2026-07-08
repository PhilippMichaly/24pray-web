// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from './ShareButton';
import { useToastStore } from '@/components/ui/toast-store';
import type { ProjectWithStats } from '@/types';

const publicProject = {
  id: 'p-pub',
  title: 'Nachtgebet für die Stadt',
  description: 'Wir beten für Frieden.',
  visibility: 'PUBLIC',
  organizerId: 'org-1',
} as ProjectWithStats;

const privateProject = { ...publicProject, id: 'p-priv', visibility: 'PRIVATE' } as ProjectWithStats;

describe('ShareButton (Teilen)', () => {
  beforeEach(() => {
    cleanup();
    useToastStore.setState({ toasts: [] });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('PRIVATE-Kette als Nicht-Organisator: Button ist ausgeblendet', () => {
    const { container } = render(
      <ShareButton project={privateProject} isOrganizer={false} inviteUrl="https://24pray.org/join/tok" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('PUBLIC-Kette: navigator.share wird mit der Projekt-URL aufgerufen', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: shareMock });

    render(<ShareButton project={publicProject} isOrganizer={false} inviteUrl={null} />);
    fireEvent.click(screen.getByRole('button', { name: /teilen/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1));
    const arg = shareMock.mock.calls[0][0];
    expect(arg.url).toBe(`${window.location.origin}/projects/p-pub`);
    expect(arg.title).toBe('Nachtgebet für die Stadt');
  });

  it('PRIVATE-Kette als Organisator: teilt den Invite-Link statt der Projekt-URL', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: shareMock });

    render(
      <ShareButton project={privateProject} isOrganizer={true} inviteUrl="https://24pray.org/join/tok" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /teilen/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1));
    expect(shareMock.mock.calls[0][0].url).toBe('https://24pray.org/join/tok');
  });

  it('kein navigator.share (Headless/Desktop-Browser ohne Web-Share-API): Fallback auf Zwischenablage + Toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });

    render(<ShareButton project={publicProject} isOrganizer={false} inviteUrl={null} />);
    fireEvent.click(screen.getByRole('button', { name: /teilen/i }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/projects/p-pub`),
    );
    await waitFor(() => expect(useToastStore.getState().toasts[0]?.message).toBe('Link kopiert.'));
  });

  it('AbortError (User bricht Share-Sheet ab) wird still geschluckt, kein Fallback/Toast', async () => {
    const abortError = new DOMException('cancelled', 'AbortError');
    const shareMock = vi.fn().mockRejectedValue(abortError);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: shareMock, clipboard: { writeText } });

    render(<ShareButton project={publicProject} isOrganizer={false} inviteUrl={null} />);
    fireEvent.click(screen.getByRole('button', { name: /teilen/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1));
    expect(writeText).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
