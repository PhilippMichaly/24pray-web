'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ProjectWithStats } from '@/types';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ProjectWithStats>(`/join/${token}`)
      .then(setProject)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) return <main className="p-8 text-red-600">Einladung ungültig.</main>;
  if (!project) return <main className="p-8">Lädt…</main>;

  return (
    <main className="mx-auto max-w-2xl p-8 text-center">
      <h1 className="mb-2 text-2xl font-bold">Du bist eingeladen: {project.title}</h1>
      <p className="mb-6 text-gray-600">{project.organizerName} · {project.bookedSlots}/{project.totalSlots} Slots belegt</p>
      <Link href={`/projects/${project.id}`} className="rounded bg-blue-600 px-4 py-2 text-white">
        Zum Projekt &amp; Slot übernehmen
      </Link>
    </main>
  );
}
