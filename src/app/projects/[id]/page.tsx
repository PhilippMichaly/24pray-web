'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { ProjectWithStats, SlotView } from '@/types';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, s] = await Promise.all([
        api.get<ProjectWithStats>(`/projects/${id}`),
        api.get<SlotView[]>(`/projects/${id}/slots`),
      ]);
      setProject(p);
      setSlots(s);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function book(startTime: string) {
    try {
      await api.post(`/projects/${id}/slots`, { startTime, notifyChannel: 'EMAIL' });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error) return <main className="p-8 text-red-600">{error}</main>;
  if (!project) return <main className="p-8">Lädt…</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">{project.title}</h1>
      <p className="mb-6 text-sm text-gray-600">
        {project.organizerName} · {project.bookedSlots}/{project.totalSlots} belegt
      </p>
      <ul className="space-y-2">
        {slots.map((s) => (
          <li key={s.startTime} className="flex items-center justify-between rounded border p-3">
            <span>
              {new Date(s.startTime).toLocaleString('de-DE')} —{' '}
              {s.status === 'BOOKED' ? `belegt (${s.userName ?? 'jemand'})` : 'frei'}
            </span>
            {s.status === 'FREE' && (
              <button onClick={() => book(s.startTime)} className="rounded bg-blue-600 px-3 py-1 text-white">
                Übernehmen
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
