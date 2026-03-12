import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '24pray — Gemeinsam beten',
  description:
    'Organisiere Gebetsketten, buche deinen Slot und bete gemeinsam mit deiner Gemeinde.',
  openGraph: {
    title: '24pray — Gemeinsam beten',
    description: 'Organisiere Gebetsketten und buche deinen Gebets-Slot.',
    url: 'https://24pray.org',
    siteName: '24pray',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[var(--bg)]">{children}</body>
    </html>
  );
}
