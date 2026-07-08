import { cn, initials } from '@/lib/utils';

export interface AvatarProps {
  name: string | null;
  size?: 'sm' | 'md';
  variant?: 'default' | 'mine';
  className?: string;
}

// Kein Bild-Support v1 (Domäne hat keine Avatare) — reine Initialen auf accent-soft.
export function Avatar({ name, size = 'md', variant = 'default', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold',
        size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm',
        'bg-accent-soft text-accent-strong',
        variant === 'mine' && 'ring-2 ring-accent ring-offset-1 ring-offset-bg',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
