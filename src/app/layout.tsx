import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Fraunces, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { isRtl, parseLocale, translate } from '@/lib/i18n';
import { DEFAULT_LOCALE, SITE_URL, absoluteUrl, landingPath } from '@/lib/routes';
import { LOCALE_HEADER, PREFIXED_HEADER } from '@/middleware';

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
  metadataBase: new URL(SITE_URL),
  title: translate(DEFAULT_LOCALE, 'seoSiteTitle'),
  description: translate(DEFAULT_LOCALE, 'seoSiteDescription'),
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: translate(DEFAULT_LOCALE, 'seoSiteTitle'),
    description: translate(DEFAULT_LOCALE, 'seoSiteDescription'),
    url: absoluteUrl(landingPath(DEFAULT_LOCALE)),
    siteName: '24pray',
    locale: 'de_DE',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: translate(DEFAULT_LOCALE, 'seoSiteTitle') }],
  },
  twitter: {
    card: 'summary_large_image',
    title: translate(DEFAULT_LOCALE, 'seoSiteTitle'),
    description: translate(DEFAULT_LOCALE, 'seoSiteDescription'),
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
  // Die Middleware legt die aufgelöste Sprache an den Request. Sie hier zu lesen ist der
  // Grund, warum `lang`/`dir` schon im ersten HTML stimmen — vorher korrigierte das erst
  // ein Effekt nach der Hydration, was Crawler nie sahen und RTL kurz flackern ließ.
  const h = headers();
  const locale = parseLocale(h.get(LOCALE_HEADER)) ?? DEFAULT_LOCALE;
  const prefixed = h.get(PREFIXED_HEADER) === '1';

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={`${fraunces.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen bg-bg text-ink">
        <Providers locale={locale} prefixed={prefixed}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
