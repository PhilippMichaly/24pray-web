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

  put<T>(path: string, body?: unknown) {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export const api = new ApiClient(API_URL);

// ── Slot-Helper (Welle 2/3) ────────────────────
import type { PrayerSlot, SlotView, PrayerRequestView, ProjectStats } from '@/types';

/** Query-Suffix für den Invite-Token (PRIVATE-Ketten per Einladungslink, W3). */
const inviteQ = (invite?: string) => (invite ? `?invite=${encodeURIComponent(invite)}` : '');

export function getSlotGrid(projectId: string, invite?: string) {
  return api.get<SlotView[]>(`/projects/${projectId}/slots${inviteQ(invite)}`);
}

export function bookSlot(
  projectId: string,
  input: {
    startTime: string;
    guestName?: string;
    guestEmail?: string;
    locationLat?: number; // Beter-Standort (W3.5), nur Koordinaten
    locationLon?: number;
  },
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

// ── Welle 3 ────────────────────────────────────

/** „Jede Woche übernehmen" — materialisiert Folgewochen aus dem eigenen Slot. */
export function recurSlot(slotId: string) {
  return api.post<{ recurringId: string; createdSlotIds: string[] }>(`/slots/${slotId}/recur`);
}

export function getRequests(projectId: string, invite?: string) {
  return api.get<PrayerRequestView[]>(`/projects/${projectId}/requests${inviteQ(invite)}`);
}

export function postRequest(
  projectId: string,
  body: { text: string; authorName?: string },
  invite?: string,
) {
  return api.post<PrayerRequestView>(`/projects/${projectId}/requests${inviteQ(invite)}`, body);
}

export function getProjectStats(projectId: string, invite?: string) {
  return api.get<ProjectStats>(`/projects/${projectId}/stats${inviteQ(invite)}`);
}

export function getReminderPref() {
  return api.get<{ minutesBefore: number; channel: string }>('/me/reminder');
}

export function putReminderPref(minutesBefore: number) {
  return api.put<{ minutesBefore: number; channel: string }>('/me/reminder', { minutesBefore });
}
