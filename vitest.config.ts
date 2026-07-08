import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // Next-tsconfig lässt JSX unangetastet („preserve") — für Komponententests hier transformieren.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
