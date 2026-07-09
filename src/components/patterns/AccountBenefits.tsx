'use client';

import { CheckCircle2 } from 'lucide-react';
import { t } from '@/lib/i18n';

/** Konto-Nutzen (Backlog 6): sanfte Konversion nach Gast-Buchung + auf der Login-Seite — kein Zwang. */
export function AccountBenefits({ compact }: { compact?: boolean }) {
  const size = compact ? 'text-xs' : 'text-sm';
  return (
    <div className={`${size} text-ink-muted`}>
      <p className="font-medium text-ink">{t('accountBenefitsTitle')}</p>
      <ul className="mt-1 space-y-1">
        {(['accountBenefit1', 'accountBenefit2', 'accountBenefit3'] as const).map((key) => (
          <li key={key} className="flex items-start gap-2">
            <CheckCircle2 size={compact ? 13 : 15} className="mt-0.5 shrink-0 text-positive" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
