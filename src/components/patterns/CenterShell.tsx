import { ThemeToggle } from './ThemeToggle';

// Zentrierte Bühne für Pre-Auth-Screens (Landing/Login/Verify).
// Theme-Toggle bleibt oben rechts erreichbar (Akzeptanzkriterium Welle 1).
export function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="absolute end-4 top-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
