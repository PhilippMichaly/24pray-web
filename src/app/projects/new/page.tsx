'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { ProjectVisibility, ProjectWithStats } from '@/types';

const DEFAULT_TZ =
  typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin'
    : 'Europe/Berlin';

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

    if (!title.trim()) return setError('Bitte einen Titel angeben.');
    if (!startDate || !endDate) return setError('Bitte Start und Ende angeben.');
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return setError('Das Ende muss nach dem Start liegen.');

    setSubmitting(true);
    try {
      // datetime-local has no timezone; toISOString() yields UTC ISO with "Z"
      // which the backend's zod .datetime() expects.
      const project = await api.post<ProjectWithStats>('/projects', {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        timezone: DEFAULT_TZ,
        visibility,
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (loading) return <main className="p-8">Lädt…</main>;
  if (!user)
    return (
      <main className="p-8">
        Bitte{' '}
        <Link className="underline" href="/auth/login">
          einloggen
        </Link>
        .
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Neues Gebetsprojekt</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Titel
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border p-2"
            placeholder="z.B. Nachtgebet"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Beschreibung <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border p-2"
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
              Start
            </label>
            <input
              id="startDate"
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border p-2"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
              Ende
            </label>
            <input
              id="endDate"
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded border p-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="visibility" className="mb-1 block text-sm font-medium">
            Sichtbarkeit
          </label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
            className="w-full rounded border p-2"
          >
            <option value="PRIVATE">Privat (nur per Einladungslink)</option>
            <option value="PUBLIC">Öffentlich (für alle sichtbar)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? 'Wird erstellt…' : 'Projekt erstellen'}
          </button>
          <Link href="/dashboard" className="text-gray-600 underline">
            Abbrechen
          </Link>
        </div>
      </form>
    </main>
  );
}
