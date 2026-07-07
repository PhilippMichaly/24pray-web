import { create } from 'zustand';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  variant?: 'default' | 'positive' | 'danger';
  action?: ToastAction;
  durationMs?: number; // default 6000 (Undo-Fenster)
}

export interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (opts) => {
    const id = nextId++;
    const duration = opts.durationMs ?? 6000;
    set((s) => ({ toasts: [...s.toasts, { ...opts, id }].slice(-3) }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Bequemer Helper außerhalb von React-Komponenten. */
export const toast = (opts: ToastOptions) => useToastStore.getState().push(opts);
