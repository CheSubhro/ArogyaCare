import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
}

export default function Input({
    label,
    error,
    helperText,
    required,
    className = '',
    id,
    ...props
}: InputProps) {
    const inputId = id ?? props.name;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                >
                    {label}

                    {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                </label>
            )}

            <input
                id={inputId}
                aria-invalid={!!error}
                aria-describedby={
                    error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                }
                className={`
          h-10
          w-full
          rounded-lg
          border
          bg-[var(--color-surface)]
          px-3
          text-sm
          text-[var(--color-text)]
          outline-none
          transition-colors
          placeholder:text-[var(--color-text-muted)]
          focus:ring-2
          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:opacity-70
          ${
              error
                  ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-red-100'
                  : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-teal-100'
          }
          ${className}
        `}
                {...props}
            />

            {error && (
                <p id={`${inputId}-error`} className="mt-1 text-sm text-[var(--color-danger)]">
                    {error}
                </p>
            )}

            {!error && helperText && (
                <p id={`${inputId}-helper`} className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {helperText}
                </p>
            )}
        </div>
    );
}
