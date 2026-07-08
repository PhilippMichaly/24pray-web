'use client';

import * as RTooltip from '@radix-ui/react-tooltip';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

// Nur Pointer (kein Touch), delay 300ms.
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <RTooltip.Provider delayDuration={300}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content
            sideOffset={6}
            className="z-50 rounded-sm border bg-surface px-2.5 py-1.5 text-xs text-ink shadow-2"
          >
            {content}
            <RTooltip.Arrow className="fill-surface" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}
