import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    options: SelectOption[];
    placeholder?: string;
}

export default function Select({
    label,
    error,
    helperText,
    required,
    options,
    placeholder = 'Select an option',
    className = '',
    id,
    ...props
}: SelectProps) {
    const selectId = id ?? props.name;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={selectId}
                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                >
                    {label}

                    {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                </label>
            )}

            <select
                id={selectId}
                aria-invalid={!!error}
                aria-describedby={
                    error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
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
            >
                <option value="">{placeholder}</option>

                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && (
                <p id={`${selectId}-error`} className="mt-1 text-sm text-[var(--color-danger)]">
                    {error}
                </p>
            )}

            {!error && helperText && (
                <p
                    id={`${selectId}-helper`}
                    className="mt-1 text-sm text-[var(--color-text-muted)]"
                >
                    {helperText}
                </p>
            )}
        </div>
    );
}
