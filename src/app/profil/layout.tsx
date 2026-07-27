import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';

// App-Route: kontoabhängig bzw. Einweg-Link aus einer E-Mail — gehört nicht in den Index.
export const metadata: Metadata = NOINDEX;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
