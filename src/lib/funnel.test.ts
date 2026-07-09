// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const post = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock('@/lib/api', () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { useFunnelPing } from './funnel';

describe('funnel ping (Backlog 8)', () => {
  beforeEach(() => post.mockClear());

  it('pingt einmal pro Mount, nicht pro Re-Render', () => {
    const { rerender } = renderHook(() => useFunnelPing('landing'));
    rerender();
    rerender();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/funnel/hit', { step: 'landing' });
  });

  it('schluckt Fehler still (Zählen kippt nie die Seite)', () => {
    post.mockRejectedValueOnce(new Error('down'));
    expect(() => renderHook(() => useFunnelPing('watch'))).not.toThrow();
  });
});
