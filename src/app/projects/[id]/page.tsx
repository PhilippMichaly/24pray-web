export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <main className="p-6">
      <h1 className="font-display text-2xl font-bold">Projekt</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Projekt ID: {params.id} — Slot-Kalender wird in Phase 2 implementiert.
      </p>
    </main>
  );
}
