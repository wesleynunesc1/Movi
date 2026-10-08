import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-movi-yellow focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl active:scale-[0.99]';

    const variants = {
      primary:
        'bg-movi-yellow text-movi-graphite font-semibold hover:bg-movi-yellow-hover active:bg-movi-yellow-active shadow-subtle',
      secondary:
        'bg-white text-movi-graphite border border-border hover:bg-surface-secondary active:bg-surface-hover shadow-subtle',
      outline:
        'bg-transparent border border-movi-graphite text-movi-graphite hover:bg-movi-graphite hover:text-white',
      ghost:
        'bg-transparent text-text-secondary hover:text-movi-graphite hover:bg-surface-secondary',
      danger:
        'bg-status-danger text-white hover:bg-red-700 active:bg-red-800 shadow-subtle',
      dark:
        'bg-movi-graphite text-white hover:bg-movi-graphite-hover active:bg-movi-graphite-active shadow-subtle',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5 font-semibold',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
