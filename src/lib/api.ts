const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // für httpOnly Cookies
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    // 204 No Content (logout, slot-cancel) and empty bodies have no JSON to parse.
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export const api = new ApiClient(API_URL);

// ── Slot-Helper (Welle 2) ──────────────────────
import type { PrayerSlot, SlotView } from '@/types';

export function getSlotGrid(projectId: string) {
  return api.get<SlotView[]>(`/projects/${projectId}/slots`);
}

export function bookSlot(
  projectId: string,
  input: { startTime: string; guestName?: string; guestEmail?: string },
) {
  return api.post<PrayerSlot>(`/projects/${projectId}/slots`, {
    ...input,
    notifyChannel: 'EMAIL',
  });
}

/** Storno. Gast reicht seinen guestToken als Query mit (§6.3). */
export function cancelSlot(slotId: string, guestToken?: string) {
  const q = guestToken ? `?guestToken=${encodeURIComponent(guestToken)}` : '';
  return api.delete<void>(`/slots/${slotId}${q}`);
}
