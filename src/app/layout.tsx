import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'], // Variable Font: kein weight (wght-Achse implizit), Ziffern via tnum in CSS
  variable: '--font-fraunces',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

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
    <html
      lang="de"
      suppressHydrationWarning
      className={`${fraunces.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen bg-bg text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
