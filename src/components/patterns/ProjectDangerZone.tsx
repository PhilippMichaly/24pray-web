'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProject } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/toast-store';
import { t } from '@/lib/i18n';

/**
 * Wache endgültig löschen (Ersteller-Lebenszyklus) — nur Organisator.
 * Muster wie DangerZone in /profil: Zwei-Schritt-Bestätigung, dann Redirect.
 * Die API verschickt vorher eine Abschieds-Mail an künftige Gebuchte.
 */
export function ProjectDangerZone({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteProject(projectId);
      toast({ message: t('projectDeleted'), variant: 'positive' });
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'danger' });
      setDeleting(false);
    }
  }

  return (
    <Card elevation={1} className="border-danger/40 bg-danger/5">
      <h2 className="text-sm font-semibold text-ink">{t('projectDangerZone')}</h2>
      <p className="mt-1 text-xs text-ink-muted">{t('projectDeleteWarning')}</p>
      {confirming ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-danger">{t('projectDeleteConfirmText')}</p>
          <div className="flex gap-2">
            <Button variant="danger-fill" loading={deleting} onClick={onDelete}>
              {t('projectDeleteConfirmButton')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" className="mt-4" onClick={() => setConfirming(true)}>
          {t('projectDeleteCta')}
        </Button>
      )}
    </Card>
  );
}
