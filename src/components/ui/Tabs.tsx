'use client';

import * as RTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export interface TabsProps {
  tabs: { id: string; label: string; disabled?: boolean }[];
  value: string;
  onValueChange: (id: string) => void;
  children: React.ReactNode;
}

// Projekt-Detail: „Kette" aktiv, „Anliegen"/„Statistik" disabled bis Welle 3.
export function Tabs({ tabs, value, onValueChange, children }: TabsProps) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange}>
      <RTabs.List className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <RTabs.Trigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              'border-transparent text-ink-muted hover:text-ink',
              'data-[state=active]:border-accent data-[state=active]:text-ink',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            )}
          >
            {tab.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {children}
    </RTabs.Root>
  );
}

export const TabPanel = RTabs.Content;
