import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-movi-graphite">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-text-secondary pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full h-11 px-3.5 text-sm bg-white text-movi-graphite border rounded-xl placeholder:text-text-muted transition-colors duration-150',
              'border-border focus:border-movi-graphite focus:outline-none focus:ring-2 focus:ring-movi-yellow/50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-status-danger focus:border-status-danger focus:ring-status-danger/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-text-secondary flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-status-danger font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-text-secondary">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
