import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 ' +
    'transition-[background-color,color] duration-fast ease-enter',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-bg hover:bg-accent-strong',
        secondary: 'bg-surface-sunken text-ink hover:bg-border',
        ghost: 'bg-transparent text-ink hover:bg-surface-sunken',
        danger: 'bg-transparent text-danger hover:bg-danger/10',
        'danger-fill': 'bg-danger text-bg hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'min-h-[44px] px-5 text-base',
        lg: 'min-h-[48px] px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: LucideIcon;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon: Icon, asChild, children, disabled, ...props }, ref) => {
    // asChild (z. B. <Link>): Slot erlaubt nur EIN Kind — kein Icon/Spinner als Geschwister injizieren.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner size={18} /> : Icon ? <Icon size={20} aria-hidden /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
