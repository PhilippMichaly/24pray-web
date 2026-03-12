export default function JoinPage({ params }: { params: { token: string } }) {
  return (
    <main className="p-6">
      <h1 className="font-display text-2xl font-bold">Einladung</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Invite Token: {params.token} — Slot-Kalender wird in Phase 2 implementiert.
      </p>
    </main>
  );
}
