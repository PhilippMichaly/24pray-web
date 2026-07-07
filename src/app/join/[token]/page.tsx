'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ProjectWithStats } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CenterShell } from '@/components/patterns/CenterShell';
import { Brand } from '@/components/patterns/Brand';
import { MailX } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<ProjectWithStats>(`/join/${token}`)
      .then(setProject)
      .catch(() => setError(true));
  }, [token]);

  if (error) {
    return (
      <CenterShell>
        <EmptyState icon={MailX} title={t('invitationInvalid')} />
      </CenterShell>
    );
  }

  return (
    <CenterShell>
      <div className="w-full max-w-[420px]">
        <Brand size="sm" className="mb-6" />
        {!project ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <Card elevation={2} className="text-center">
            <p className="text-sm text-ink-muted">{t('invitedToTitle')}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{project.title}</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {t('invitedToLead', { name: project.organizerName })}
            </p>

            <div className="mx-auto mt-5 max-w-[280px]">
              <p className="mb-2 text-sm text-ink-muted tnum">
                {t('slotsBookedOf', { booked: project.bookedSlots, total: project.totalSlots })}
              </p>
              <Progress value={project.bookedSlots} max={project.totalSlots} />
            </div>

            <Button asChild size="lg" className="mt-6 w-full">
              <Link href={`/projects/${project.id}`}>{t('toProjectTakeSlot')}</Link>
            </Button>
          </Card>
        )}
      </div>
    </CenterShell>
  );
}
