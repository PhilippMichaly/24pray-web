import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  elevation?: 1 | 2 | 3;
  as?: React.ElementType;
}

const shadowByElevation: Record<1 | 2 | 3, string> = {
  1: 'shadow-1',
  2: 'shadow-2',
  3: 'shadow-3',
};

export function Card({ className, elevation = 1, as: Comp = 'div', ...props }: CardProps) {
  return (
    <Comp
      className={cn(
        'rounded-lg border bg-surface p-6',
        shadowByElevation[elevation],
        className,
      )}
      {...props}
    />
  );
}
