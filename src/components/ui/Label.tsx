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

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}
