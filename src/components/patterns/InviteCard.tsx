'use client';

import { useState } from 'react';
import { Copy, Link2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/toast-store';
import { rotateInvite } from '@/lib/api';
import { t } from '@/lib/i18n';

export interface InviteCardProps {
  projectId: string;
  inviteUrl: string;
  /** Neuer Token nach erfolgreichem Erneuern — der Eltern-State hält ihn, damit auch Teilen & Co. konsistent bleiben. */
  onRotated: (inviteToken: string) => void;
}

export function InviteCard({ projectId, inviteUrl, onRotated }: InviteCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [rotating, setRotating] = useState(false);

  async function rotate() {
    setRotating(true);
    try {
      const { inviteToken } = await rotateInvite(projectId);
      onRotated(inviteToken);
      setConfirming(false);
      toast({ message: t('inviteRotatedToast'), variant: 'positive' });
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'danger' });
    } finally {
      setRotating(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({ message: t('linkCopiedToast'), variant: 'positive' });
    } catch {
      toast({ message: inviteUrl });
    }
  }

  return (
    <Card elevation={1} className="bg-surface-sunken">
      <div className="flex items-center gap-2 text-ink">
        <Link2 size={16} className="text-accent" aria-hidden />
        <h3 className="text-sm font-semibold">{t('inviteTitle')}</h3>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{t('inviteHint')}</p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={inviteUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-sm border bg-surface px-3 py-2 text-sm text-ink-muted"
        />
        <Button size="sm" icon={Copy} onClick={copy}>
          {t('copyLinkBtn')}
        </Button>
      </div>
      {confirming ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-ink-muted">{t('inviteRotateConfirm')}</p>
          <div className="flex gap-2">
            <Button size="sm" loading={rotating} onClick={rotate}>
              {t('inviteRotateDo')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" icon={RefreshCw} className="mt-2" onClick={() => setConfirming(true)}>
          {t('inviteRotate')}
        </Button>
      )}
    </Card>
  );
}
