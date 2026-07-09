import { toast } from '@/components/ui/toast-store';
import { t } from '@/lib/i18n';

// Gemeinsame Share-Intents (Backlog 1+4, User-Regel Messenger-Trio):
// WhatsApp/Telegram als reine Deep-Links, Signal NUR über den System-Share-Sheet —
// Signal hat keinen Text-Share-Deep-Link. Keine Messenger-APIs, keine Daten an Dritte.

export function buildWatchUrl(projectId: string, invite?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://24pray.org';
  return `${origin}/projects/${projectId}${invite ? `?invite=${encodeURIComponent(invite)}` : ''}`;
}

export function waShareHref(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
}

export function tgShareHref(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export async function shareViaSystem(text: string, url: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text, url });
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return; // Nutzer bricht Share-Sheet ab — still schlucken
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(`${text}\n\n${url}`);
    toast({ message: t('linkCopiedToast'), variant: 'positive' });
  } catch {
    toast({ message: `${t('shareCopyFailed')} ${url}` });
  }
}
