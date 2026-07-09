'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

// Cookiefreies Funnel-Zählen (Backlog 8): nur der Step-Name geht an den eigenen Server,
// aggregiert zu Tageszählern — keine Cookies, keine IDs, kein Banner nötig.
export type FunnelPageStep = 'landing' | 'list' | 'watch';

export function pingFunnel(step: FunnelPageStep): void {
  api.post('/funnel/hit', { step }).catch(() => {
    /* Zählen darf nie stören */
  });
}

/** Einmal pro Seiten-Mount pingen (StrictMode-Doppel-Mount in dev ist als Unschärfe akzeptiert). */
export function useFunnelPing(step: FunnelPageStep): void {
  useEffect(() => {
    pingFunnel(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
