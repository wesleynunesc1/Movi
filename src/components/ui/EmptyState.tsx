import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-border flex items-center justify-center text-text-secondary mb-4 shadow-subtle">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold font-display text-movi-graphite max-w-sm">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-text-secondary max-w-md mt-1.5 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
