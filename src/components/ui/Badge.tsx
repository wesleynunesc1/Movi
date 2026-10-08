import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'yellow' | 'success' | 'warning' | 'danger' | 'graphite' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-surface-secondary text-movi-graphite border border-border',
    yellow: 'bg-movi-yellow text-movi-graphite font-semibold',
    success: 'bg-status-success-bg text-status-success border border-status-success-border font-medium',
    warning: 'bg-status-warning-bg text-status-warning border border-status-warning-border font-medium',
    danger: 'bg-status-danger-bg text-status-danger border border-status-danger-border font-medium',
    graphite: 'bg-movi-graphite text-white font-medium',
    outline: 'bg-transparent border border-border text-text-secondary',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 font-sans select-none tracking-wide', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
