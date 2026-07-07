'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from './toast-store';

const variantClass: Record<string, string> = {
  default: 'border-border',
  positive: 'border-positive/40',
  danger: 'border-danger/40',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border bg-surface px-4 py-3 shadow-2',
            variantClass[toast.variant ?? 'default'],
          )}
        >
          <span className="flex-1 text-sm text-ink">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                dismiss(toast.id);
              }}
              className="shrink-0 text-sm font-semibold text-accent-strong hover:opacity-80"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Schließen"
            className="shrink-0 text-ink-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
