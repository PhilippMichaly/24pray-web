'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/toast-store';
import { t } from '@/lib/i18n';
import type { ProjectWithStats } from '@/types';

const DESCRIPTION_MAX_LEN = 160;

function truncate(text: string, max = DESCRIPTION_MAX_LEN): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export interface ShareButtonProps {
  project: ProjectWithStats;
  /** Ist der aktuell eingeloggte Nutzer der Organisator dieser Kette? */
  isOrganizer: boolean;
  /** Einladungslink der Kette (nur PRIVATE relevant; von der Seite bereits geladen). */
  inviteUrl: string | null;
}

/**
 * Teilen-Button (Punkt 4): PUBLIC teilt die Ketten-URL, PRIVATE nur für den Organisator
 * (teilt den Invite-Link) — als Nicht-Organisator einer PRIVATE-Kette unsichtbar.
 */
export function ShareButton({ project, isOrganizer, inviteUrl }: ShareButtonProps) {
  if (project.visibility === 'PRIVATE' && !isOrganizer) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://24pray.org';
  const shareUrl = project.visibility === 'PUBLIC' ? `${origin}/projects/${project.id}` : inviteUrl;
  if (!shareUrl) return null;

  async function handleShare() {
    const shareData = {
      title: project.title,
      text: project.description ? truncate(project.description) : undefined,
      url: shareUrl as string,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return; // Nutzer bricht Share-Sheet ab — still schlucken
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl as string);
      toast({ message: t('linkCopiedToast'), variant: 'positive' });
    } catch {
      toast({ message: shareUrl as string });
    }
  }

  return (
    <Button size="sm" variant="secondary" icon={Share2} onClick={handleShare}>
      {t('shareButton')}
    </Button>
  );
}
