import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <Icon size={32} className="text-ink-muted" aria-hidden />
      <h2 className="mt-4 font-display text-xl font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {action &&
            (action.href ? (
              <Button asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            ))}
          {secondaryAction?.href && (
            <Link
              href={secondaryAction.href}
              className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
