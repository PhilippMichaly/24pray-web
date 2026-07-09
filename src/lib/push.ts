'use client';

import { api } from '@/lib/api';

// Web-Push Opt-in (Backlog 7): self-hosted VAPID, kein Drittdienst. Nur eingeloggte Nutzer —
// die Subscription hängt am Konto (Erinnerungen + Owner-Updates als Zweitkanal neben Mail).

export function isPushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushState = 'unsupported' | 'unavailable' | 'denied' | 'subscribed' | 'unsubscribed';

export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    await api.get<{ key: string }>('/push/vapid-key');
  } catch {
    return 'unavailable'; // Server hat Push (noch) nicht konfiguriert
  }
  const reg = await navigator.serviceWorker.register('/sw.js');
  const sub = await reg.pushManager.getSubscription();
  return sub ? 'subscribed' : 'unsubscribed';
}

export async function enablePush(): Promise<void> {
  const { key } = await api.get<{ key: string }>('/push/vapid-key');
  const reg = await navigator.serviceWorker.register('/sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('denied');
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await api.post('/me/push-subscriptions', { endpoint: json.endpoint, keys: json.keys });
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.register('/sw.js');
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const json = sub.toJSON() as { endpoint: string };
  await sub.unsubscribe();
  await api.delete('/me/push-subscriptions', { endpoint: json.endpoint }).catch(() => {});
}
