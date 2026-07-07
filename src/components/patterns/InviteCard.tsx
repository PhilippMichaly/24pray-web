'use client';

import { Copy, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/toast-store';
import { t } from '@/lib/i18n';

export interface InviteCardProps {
  inviteUrl: string;
}

export function InviteCard({ inviteUrl }: InviteCardProps) {
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
    </Card>
  );
}
