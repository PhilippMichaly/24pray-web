import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-ink-muted', className)}
      {...props}
    />
  );
}

/** `id` optional — damit ein Feld per `aria-describedby` auf die Meldung verweisen kann. */
export function FieldError({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}
