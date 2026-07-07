'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  side?: 'bottom' | 'center';
}

// Bottom-Sheet (<md) / zentrierter Dialog (≥md). reduced-motion → nur Opacity (globals.css).
export function Sheet({ open, onOpenChange, title, children, side }: SheetProps) {
  const forceBottom = side === 'bottom';
  const forceCenter = side === 'center';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-[hsl(35_30%_10%/0.4)] data-[state=open]:animate-in data-[state=open]:fade-in"
        />
        <Dialog.Content
          className={cn(
            'fixed z-50 border bg-surface shadow-3 focus:outline-none',
            // Mobile: bottom sheet
            !forceCenter &&
              'inset-x-0 bottom-0 rounded-t-lg p-6 pb-8 duration-slow ease-enter',
            // Desktop: zentriert
            !forceBottom &&
              'md:inset-auto md:left-1/2 md:top-1/2 md:bottom-auto md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg',
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            {title ? (
              <Dialog.Title className="font-display text-xl font-semibold text-ink">
                {title}
              </Dialog.Title>
            ) : (
              <Dialog.Title className="sr-only">Dialog</Dialog.Title>
            )}
            <Dialog.Close
              aria-label="Schließen"
              className="-mr-1 -mt-1 rounded-sm p-1 text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
