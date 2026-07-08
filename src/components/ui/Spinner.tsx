import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// animate-spin wird bei prefers-reduced-motion global auf ~statisch gedrosselt (globals.css).
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin', className)} aria-hidden />;
}
