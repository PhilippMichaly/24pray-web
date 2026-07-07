'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { ProjectVisibility, ProjectWithStats } from '@/types';
import { AppShell } from '@/components/patterns/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { EmptyState } from '@/components/ui/EmptyState';
import { FolderHeart } from 'lucide-react';
import { browserTz } from '@/lib/time';
import { t } from '@/lib/i18n';

export default function NewProjectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('PRIVATE');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError(t('errTitleRequired'));
    if (!startDate || !endDate) return setError(t('errDatesRequired'));
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return setError(t('errEndAfterStart'));

    setSubmitting(true);
    try {
      const project = await api.post<ProjectWithStats>('/projects', {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        timezone: browserTz(),
        visibility,
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (loading) return <AppShell>{null}</AppShell>;
  if (!user) {
    return (
      <AppShell>
        <EmptyState
          icon={FolderHeart}
          title={t('pleaseLogin', { login: t('login') })}
          action={{ label: t('login'), href: '/auth/login' }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">{t('newProjectTitle')}</h1>
      <Card elevation={1}>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">{t('fieldTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('fieldTitlePlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">
              {t('fieldDescription')} <span className="text-ink-muted">({t('optional')})</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="startDate">{t('fieldStart')}</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">{t('fieldEnd')}</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="visibility">{t('fieldVisibility')}</Label>
            <Select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
            >
              <option value="PRIVATE">{t('visibilityPrivate')}</option>
              <option value="PUBLIC">{t('visibilityPublic')}</option>
            </Select>
          </div>

          <FieldError>{error}</FieldError>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" loading={submitting}>
              {submitting ? t('creating') : t('createProject')}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">{t('cancel')}</Link>
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
