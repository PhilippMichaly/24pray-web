'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { browserTz } from '@/lib/time';
import { t } from '@/lib/i18n';

export interface TimezoneHintProps {
  projectTimezone: string;
}

// Rendert NUR wenn projectTimezone !== Browser-TZ (client-only, um Hydration-Mismatch zu vermeiden).
export function TimezoneHint({ projectTimezone }: TimezoneHintProps) {
  const [differs, setDiffers] = useState(false);
  useEffect(() => {
    setDiffers(browserTz() !== projectTimezone);
  }, [projectTimezone]);

  if (!differs) return null;
  return (
    <Badge variant="night">
      <Globe size={12} aria-hidden />
      {t('timesInTz', { tz: projectTimezone })}
    </Badge>
  );
}
