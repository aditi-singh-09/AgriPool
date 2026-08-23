import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const areaId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={areaId} className="text-sm font-medium text-parchment-200">
          {label}
        </label>
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            'min-h-28 rounded-lg border border-graphite-600 bg-graphite-800 px-3.5 py-2.5 text-sm text-parchment-50 outline-none transition-colors focus:border-marigold-500',
            error && 'border-stamp-500',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-stamp-500">{error}</p>}
      </div>
    );
  },
);
TextAreaField.displayName = 'TextAreaField';
