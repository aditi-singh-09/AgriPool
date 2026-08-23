import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, id, className, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-parchment-200">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-11 rounded-lg border border-graphite-600 bg-graphite-800 px-3.5 text-sm text-parchment-50 outline-none transition-colors focus:border-marigold-500',
            error && 'border-stamp-500',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-stamp-500">{error}</p>}
      </div>
    );
  },
);
SelectField.displayName = 'SelectField';
