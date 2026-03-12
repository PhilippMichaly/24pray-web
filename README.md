# 24pray Web

Frontend für die 24pray Gebetsplattform.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **TailwindCSS**
- **Zustand** (State Management)
- **Zod** (Validation)

## Setup

```bash
# 1. Dependencies installieren
npm install

# 2. Env-Datei erstellen
cp .env.example .env.local

# 3. Dev-Server starten
npm run dev
```

App läuft auf http://localhost:3000

## Deployment
Automatisch via Vercel bei Push auf `main`.
