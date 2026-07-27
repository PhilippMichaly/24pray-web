import type { ProjectWithStats } from '@/types';

/**
 * Serverseitiger API-Zugriff für gerendertes HTML (SEO).
 *
 * Bewusst getrennt vom Browser-Client `api.ts`: der schickt `credentials: 'include'` und redet
 * über die öffentliche Origin. Hier läuft alles anonym über den internen Port — es werden
 * ausschließlich Daten geholt, die ohnehin jeder Anonyme sehen darf.
 *
 * Zwei Regeln, die jeder Aufrufer erben soll:
 *  - Nur PUBLIC. Nichts, was hinter `?invite=` oder einer Session steckt, darf ins HTML.
 *  - Kein Fehler bricht die Seite. Timeout/Netzwerkfehler ⇒ leer, der Client rendert nach.
 */
const FETCH_TIMEOUT_MS = 3000;

function apiBase(): string {
  return process.env.API_URL_INTERNAL ?? 'http://localhost:3001';
}

async function getJson<T>(path: string, revalidate: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      signal: controller.signal,
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Eine öffentliche Wache. `null` bei 403/404, PRIVATE, Timeout oder Netzwerkfehler. */
export async function fetchPublicProject(id: string, revalidate = 60): Promise<ProjectWithStats | null> {
  const project = await getJson<ProjectWithStats>(`/projects/${encodeURIComponent(id)}`, revalidate);
  if (!project) return null;
  if (project.visibility !== 'PUBLIC') return null; // kein privater Daten-Leak in HTML/Meta-Tags
  return project;
}

/** Alle öffentlichen Wachen, neueste zuerst (Reihenfolge kommt aus der API).
 *  Der PUBLIC-Filter wird hier nochmals angelegt: die API liefert Anonymen zwar nur PUBLIC,
 *  aber diese Funktion darf auch dann nichts durchlassen, wenn sich das je ändert. */
export async function fetchPublicProjects(revalidate = 300): Promise<ProjectWithStats[]> {
  const projects = await getJson<ProjectWithStats[]>('/projects', revalidate);
  if (!Array.isArray(projects)) return [];
  return projects.filter((p) => p.visibility === 'PUBLIC');
}
