import { cn } from '@/lib/utils';

export interface BrandProps {
  size?: 'sm' | 'lg';
  monogramOnly?: boolean;
  className?: string;
}

/** Flamme-im-Zifferblatt-Monogramm (SVG). Ersetzt das alte Emoji-Logo überall. */
export function Monogram({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="1" y="1" width="38" height="38" rx="11" className="fill-accent" />
      {/* Zifferblatt-Ring */}
      <circle
        cx="20"
        cy="20"
        r="12.5"
        className="stroke-bg"
        fill="none"
        strokeWidth="1.4"
        strokeOpacity="0.35"
        strokeDasharray="1.6 3.1"
      />
      {/* Flamme */}
      <path
        d="M20 9c3.4 3.9 6.4 7 6.4 11.4 0 3.9-2.9 6.9-6.4 6.9s-6.4-3-6.4-6.9c0-1.9 1-3.6 2.3-5.2.5 1.3 1.4 2 2.4 2.2-.6-2.9.4-6 1.7-8.4Z"
        className="fill-gold"
      />
      <path
        d="M20 27.3c-2 0-3.7-1.7-3.7-3.9 0-1.8 1.4-3.2 2.3-4.5.7 2.2 2.2 2.6 2.2 2.6 1.3.9 2.9 1.7 2.9 3.4-.1 1.6-1.6 2.4-3.7 2.4Z"
        className="fill-bg"
        fillOpacity="0.85"
      />
    </svg>
  );
}

/** Wortmarke „24pray" (Display-Font) + Monogramm. */
export function Brand({ size = 'sm', monogramOnly, className }: BrandProps) {
  const box = size === 'lg' ? 'h-16 w-16' : 'h-9 w-9';
  if (monogramOnly) {
    return <Monogram className={cn(box, className)} title="24pray" />;
  }
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Monogram className={box} title="24pray" />
      <span
        className={cn(
          'font-display font-semibold tracking-tight text-ink',
          size === 'lg' ? 'text-3xl' : 'text-xl',
        )}
      >
        24pray
      </span>
    </span>
  );
}
