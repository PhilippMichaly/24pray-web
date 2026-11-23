// @vitest-environment jsdom
import { createElement } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { GlobeGL } from './GlobeGL';
import type { ChainPoint } from './Globe';

vi.mock('./Globe', () => ({
  Globe: () => createElement('div', { 'data-testid': 'globe-fallback' }),
}));

/** Minimaler WebGL2-Ersatz: jede Methode liefert ein leeres Objekt, Konstanten sind 0. */
function stubGl(compileOk = true): unknown {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'getShaderParameter' || prop === 'getProgramParameter') return () => compileOk;
        if (prop === 'getExtension') return () => null;
        if (typeof prop === 'string' && prop === prop.toUpperCase()) return 0;
        return () => ({});
      },
    },
  );
}

const POINTS: ChainPoint[] = [
  { lat: 52.5, lon: 13.4, links: [{ lat: 48.1, lon: 11.6, active: true }] },
  { lat: 40.7, lon: -74.0 },
];

let getContext: ReturnType<typeof vi.fn>;
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 30)));

function useContext(ctx: unknown) {
  getContext = vi.fn((kind: string) => (kind === 'webgl2' ? ctx : null));
  HTMLCanvasElement.prototype.getContext = getContext as unknown as HTMLCanvasElement['getContext'];
}

beforeEach(() => {
  class NoopObserver {
    observe() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', NoopObserver);
  vi.stubGlobal('IntersectionObserver', NoopObserver);
  window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
  HTMLImageElement.prototype.decode = () => Promise.resolve();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GlobeGL — Rückfall auf die Canvas-Erde', () => {
  it('ohne WebGL2 erscheint die alte Erde', async () => {
    useContext(null);
    const { findByTestId } = render(<GlobeGL activeChains={2} points={POINTS} />);
    expect(await findByTestId('globe-fallback')).toBeTruthy();
  });

  it('Shader-Fehler führt zur alten Erde', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useContext(stubGl(false));
    const { findByTestId } = render(<GlobeGL activeChains={2} points={POINTS} />);
    expect(await findByTestId('globe-fallback')).toBeTruthy();
  });

  it('Kontextverlust führt zur alten Erde', async () => {
    useContext(stubGl());
    const { container, findByTestId, queryByTestId } = render(<GlobeGL activeChains={2} points={POINTS} />);
    await settle();
    expect(queryByTestId('globe-fallback')).toBeNull();
    act(() => {
      container.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost'));
    });
    expect(await findByTestId('globe-fallback')).toBeTruthy();
  });
});

describe('GlobeGL — minütliche Datenaktualisierung', () => {
  it('neue points lassen den Grafikkontext bestehen', async () => {
    useContext(stubGl());
    const { rerender, queryByTestId } = render(<GlobeGL activeChains={2} points={POINTS} />);
    await settle();
    rerender(<GlobeGL activeChains={2} points={POINTS.map((p) => ({ ...p }))} />);
    await settle();
    rerender(<GlobeGL activeChains={3} points={[...POINTS, { lat: -33.9, lon: 151.2 }]} />);
    await settle();
    expect(queryByTestId('globe-fallback')).toBeNull();
    expect(getContext.mock.calls.filter(([kind]) => kind === 'webgl2')).toHaveLength(1);
  });
});
