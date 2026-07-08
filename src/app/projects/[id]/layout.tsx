import type { Metadata } from 'next';
import type { ProjectWithStats } from '@/types';

// Server-Metadaten pro Kette (OpenGraph/Twitter-Vorschau für geteilte Links).
// Diese Datei ist bewusst KEINE Client-Komponente — `page.tsx` in diesem Verzeichnis
// ist 'use client' und kann kein generateMetadata exportieren.

const SITE_NAME = '24pray';
const DEFAULT_TITLE = '24pray — Gemeinsam beten';
const DEFAULT_DESCRIPTION =
  'Organisiere Gebetsketten, buche deinen Slot und bete gemeinsam mit deiner Gemeinde.';
const FETCH_TIMEOUT_MS = 3000;
const DESCRIPTION_MAX_LEN = 160;

function truncate(text: string, max = DESCRIPTION_MAX_LEN): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

async function fetchPublicProject(id: string): Promise<ProjectWithStats | null> {
  const base = process.env.API_URL_INTERNAL ?? 'http://localhost:3001';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/projects/${id}`, { signal: controller.signal });
    if (!res.ok) return null; // 403/404 — kein Zugriff bzw. nicht gefunden
    const project = (await res.json()) as ProjectWithStats;
    if (project.visibility !== 'PUBLIC') return null; // kein privater Daten-Leak in Meta-Tags
    return project;
  } catch {
    return null; // Netzwerkfehler/Timeout darf die Seite nie brechen
  } finally {
    clearTimeout(timer);
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const project = await fetchPublicProject(params.id);
  if (!project) {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  }

  const title = `${project.title} — Gebetskette auf 24pray`;
  const description = project.description
    ? truncate(project.description)
    : `${project.bookedSlots} von ${project.totalSlots} Stunden gehalten — bete mit auf 24pray.`;

  // Next.js merged generateMetadata NICHT tief pro Feld — ein hier gesetztes `openGraph`/`twitter`
  // ersetzt das Root-Layout-Objekt komplett. og:image (statisch) daher hier erneut mitgeben,
  // sonst verschwindet es auf jeder Ketten-Seite.
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://24pray.org/projects/${project.id}`,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default function ProjectIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
