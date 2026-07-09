'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { updateMe, deleteMe } from '@/lib/api';
import { AppShell } from '@/components/patterns/AppShell';
import { PushSettingsCard } from '@/components/patterns/PushSettingsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { toast } from '@/components/ui/toast-store';
import { t } from '@/lib/i18n';

function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteMe();
      router.push('/');
      router.refresh();
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'danger' });
      setDeleting(false);
    }
  }

  return (
    <Card elevation={1} className="border-danger/40 bg-danger/5">
      <h2 className="text-sm font-semibold text-ink">{t('profileDangerZone')}</h2>
      <p className="mt-1 text-xs text-ink-muted">{t('profileDeleteWarning')}</p>
      {confirming ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-danger">{t('profileDeleteConfirmText')}</p>
          <div className="flex gap-2">
            <Button variant="danger-fill" loading={deleting} onClick={onDelete}>
              {t('profileDeleteConfirmButton')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" className="mt-4" onClick={() => setConfirming(true)}>
          {t('profileDeleteAccount')}
        </Button>
      )}
    </Card>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Name-Feld vorbefüllen, sobald `user` (asynchron via useAuth) vorliegt.
  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  async function onSave() {
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      setError(t('errNameLength'));
      return;
    }
    setSaving(true);
    try {
      await updateMe(trimmed);
      toast({ message: t('profileNameSaved'), variant: 'positive' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return <AppShell>{null}</AppShell>;

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">{t('profileTitle')}</h1>

      <Card elevation={1} className="space-y-4">
        <div>
          <Label htmlFor="profileName">{t('profileNameLabel')}</Label>
          <Input id="profileName" value={name} onChange={(e) => setName(e.target.value)} />
          <p className="mt-1.5 text-xs text-ink-muted">{t('profileNameHint')}</p>
        </div>
        <FieldError>{error}</FieldError>
        <Button loading={saving} onClick={onSave}>
          {t('save')}
        </Button>
      </Card>

      <div className="mt-6">
        <PushSettingsCard />
      </div>

      <div className="mt-6">
        <DangerZone />
      </div>
    </AppShell>
  );
}
