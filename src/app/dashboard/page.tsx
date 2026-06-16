'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { ProjectWithStats } from '@/types';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ProjectWithStats[]>('/projects')
      .then(setProjects)
      .catch((e) => setError(e.message));
  }, []);

  if (loading) return <main className="p-8">Lädt…</main>;
  if (!user) return <main className="p-8">Bitte <Link className="underline" href="/auth/login">einloggen</Link>.</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deine Gebetsprojekte</h1>
        <Link href="/projects/new" className="rounded bg-blue-600 px-4 py-2 text-white">
          Neues Projekt
        </Link>
      </div>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <ul className="space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded border p-4">
            <Link href={`/projects/${p.id}`} className="font-semibold underline">{p.title}</Link>
            <p className="text-sm text-gray-600">{p.bookedSlots}/{p.totalSlots} Slots belegt · {p.status}</p>
          </li>
        ))}
        {projects.length === 0 && <li className="text-gray-600">Noch keine Projekte.</li>}
      </ul>
    </main>
  );
}
