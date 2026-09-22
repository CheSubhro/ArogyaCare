import type { ReactNode } from 'react';

interface FormFieldProps {
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    children: ReactNode;
}

export default function FormField({
    label,
    error,
    helperText,
    required,
    children,
}: FormFieldProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                    {label}

                    {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                </label>
            )}

            {children}

            {error && <p className="mt-1 text-sm text-[var(--color-danger)]">{error}</p>}

            {!error && helperText && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{helperText}</p>
            )}
        </div>
    );
}
