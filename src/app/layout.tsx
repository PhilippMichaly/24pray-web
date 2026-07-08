import type { Metadata, Viewport } from 'next';
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

const DEFAULT_TITLE = '24pray — Gemeinsam beten';
const DEFAULT_DESCRIPTION =
  'Organisiere Gebetsketten, buche deinen Slot und bete gemeinsam mit deiner Gemeinde.';

export const metadata: Metadata = {
  metadataBase: new URL('https://24pray.org'),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: 'Organisiere Gebetsketten und buche deinen Gebets-Slot.',
    url: 'https://24pray.org',
    siteName: '24pray',
    locale: 'de_DE',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '24pray — Gemeinsam beten' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFCF4' },
    { media: '(prefers-color-scheme: dark)', color: '#12141F' },
  ],
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
