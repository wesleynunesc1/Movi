import React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-movi-graphite">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full h-11 px-3.5 pr-10 text-sm bg-white text-movi-graphite border rounded-xl appearance-none transition-colors duration-150',
              'border-border focus:border-movi-graphite focus:outline-none focus:ring-2 focus:ring-movi-yellow/50',
              error && 'border-status-danger focus:border-status-danger',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-text-secondary">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <span className="text-xs text-status-danger font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-text-secondary">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
