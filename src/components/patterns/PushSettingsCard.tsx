'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/toast-store';
import { getPushState, enablePush, disablePush, type PushState } from '@/lib/push';
import { t } from '@/lib/i18n';

/** Push-Opt-in pro Gerät (Backlog 7) — nur für eingeloggte Nutzer sichtbar (Profil-Seite). */
export function PushSettingsCard() {
  const [state, setState] = useState<PushState | 'loading'>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState('unsupported'));
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      if (state === 'subscribed') {
        await disablePush();
        setState('unsubscribed');
      } else {
        await enablePush();
        setState('subscribed');
      }
    } catch {
      const fresh = await getPushState().catch(() => 'unsupported' as const);
      setState(fresh);
      if (fresh === 'denied') toast({ message: t('pushStateDenied') });
    } finally {
      setBusy(false);
    }
  }

  const hint =
    state === 'subscribed' ? t('pushStateSubscribed')
    : state === 'denied' ? t('pushStateDenied')
    : state === 'unsupported' ? t('pushStateUnsupported')
    : state === 'unavailable' ? t('pushStateUnavailable')
    : t('pushCardHint');

  return (
    <Card elevation={1}>
      <h2 className="text-sm font-semibold text-ink">{t('pushCardTitle')}</h2>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      {(state === 'subscribed' || state === 'unsubscribed') && (
        <Button
          variant="secondary"
          className="mt-4"
          icon={state === 'subscribed' ? BellOff : Bell}
          loading={busy}
          onClick={toggle}
        >
          {state === 'subscribed' ? t('pushDisable') : t('pushEnable')}
        </Button>
      )}
    </Card>
  );
}
