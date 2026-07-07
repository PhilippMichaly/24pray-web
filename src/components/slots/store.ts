'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import type { ProjectWithStats, SlotView } from '@/types';
import { getSlotGrid, bookSlot, cancelSlot } from '@/lib/api';
import { toast } from '@/components/ui/toast-store';
import { buildViewModels, groupByDay, bookedCount } from './logic';
import { t } from '@/lib/i18n';

interface SlotGridState {
  slots: SlotView[];
  pendingKeys: Set<string>;
  conflictKey: string | null;
  setSlots: (slots: SlotView[]) => void;
  setPending: (key: string, on: boolean) => void;
  setConflict: (key: string | null) => void;
  patchSlot: (key: string, patch: Partial<SlotView>) => void;
}

// Ein Store — Projekt-Detail rendert genau einen Grid gleichzeitig.
export const useSlotGridStore = create<SlotGridState>((set) => ({
  slots: [],
  pendingKeys: new Set(),
  conflictKey: null,
  setSlots: (slots) => set({ slots, conflictKey: null }),
  setPending: (key, on) =>
    set((s) => {
      const next = new Set(s.pendingKeys);
      if (on) next.add(key);
      else next.delete(key);
      return { pendingKeys: next };
    }),
  setConflict: (conflictKey) => set({ conflictKey }),
  patchSlot: (key, patch) =>
    set((s) => ({
      slots: s.slots.map((sl) => (sl.startTime === key ? { ...sl, ...patch } : sl)),
    })),
}));

/** Hook: lädt Grid, liefert ViewModels (mit tickendem „now") + Buchungs-/Storno-Flow. */
export function useSlotGrid(project: ProjectWithStats | null, currentUserId: string | null) {
  const { slots, pendingKeys, conflictKey, setSlots, setPending, setConflict, patchSlot } =
    useSlotGridStore();
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  // „now" jede Minute aktualisieren (NOW-Zustand + Vergangenheit).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const reload = useCallback(async () => {
    if (!project) return;
    try {
      setSlots(await getSlotGrid(project.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [project, setSlots]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const tz = project?.timezone ?? 'UTC';
  const { models, gap } = useMemo(
    () => buildViewModels(slots, { now, projectTz: tz, pendingKeys, conflictKey }),
    [slots, now, tz, pendingKeys, conflictKey],
  );
  const days = useMemo(() => groupByDay(models, tz), [models, tz]);
  const booked = bookedCount(models);

  /** Storno (eingeloggt eigener Slot, oder via Undo). */
  const cancelBooked = useCallback(
    async (slotId: string, key: string) => {
      patchSlot(key, { status: 'FREE', isMine: false, userName: null, slotId: null });
      try {
        await cancelSlot(slotId);
      } catch (e) {
        setError((e as Error).message);
        await reload();
      }
    },
    [patchSlot, reload],
  );

  /** Eingeloggt: optimistisch buchen + Undo-Toast; 409 → Rollback + Conflict + Refetch. */
  const bookOptimistic = useCallback(
    async (key: string, myName: string | null) => {
      if (!project) return;
      const before = slots.find((s) => s.startTime === key);
      patchSlot(key, { status: 'BOOKED', isMine: true, userName: myName });
      setPending(key, true);
      try {
        const created = await bookSlot(project.id, { startTime: key });
        patchSlot(key, { slotId: created.id });
        setPending(key, false);
        toast({
          message: t('slotBookedToast'),
          variant: 'positive',
          action: {
            label: t('undo'),
            onClick: () => void cancelBooked(created.id, key),
          },
        });
      } catch (e) {
        setPending(key, false);
        // Rollback auf vorherigen Zustand.
        if (before) patchSlot(key, { status: before.status, isMine: before.isMine, userName: before.userName, slotId: before.slotId });
        const msg = (e as Error).message;
        if (/409|belegt/i.test(msg)) {
          setConflict(key);
          toast({ message: t('slotConflictToast'), variant: 'danger' });
          setTimeout(() => setConflict(null), 1500);
          await reload();
        } else {
          setError(msg);
        }
      }
    },
    [project, slots, patchSlot, setPending, setConflict, reload, cancelBooked],
  );

  return {
    models,
    days,
    gap,
    booked,
    total: project?.totalSlots ?? models.length,
    error,
    now,
    tz,
    currentUserId,
    reload,
    bookOptimistic,
    cancelBooked,
  };
}
