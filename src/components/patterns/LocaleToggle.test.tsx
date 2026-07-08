// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { setLocale } from '@/lib/i18n';
import { LocaleProvider } from '@/lib/locale-context';
import { LocaleToggle } from './LocaleToggle';

describe('LocaleToggle — Sprachmenü', () => {
  afterEach(() => {
    cleanup();
    setLocale('de');
  });

  it('öffnet ein Menü mit allen 5 Sprachen (Eigennamen)', async () => {
    render(
      <LocaleProvider>
        <LocaleToggle />
      </LocaleProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Sprache' });
    // Radix DropdownMenuTrigger öffnet über pointerdown (nicht click) — jsdom feuert das
    // nicht automatisch bei fireEvent.click mit.
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
    fireEvent.pointerUp(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
    const items = await screen.findAllByRole('menuitem');
    expect(items).toHaveLength(5);
    const labels = items.map((i) => i.textContent);
    expect(labels).toEqual(
      expect.arrayContaining(['Deutsch', 'English', 'Español', 'עברית', 'العربية']),
    );
  });
});
