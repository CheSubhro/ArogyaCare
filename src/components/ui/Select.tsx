import type { ReactNode, SelectHTMLAttributes } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    children: ReactNode;
}

export default function Select({ children, className = '', ...props }: SelectProps) {
    return (
        <select
            {...props}
            className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70 ${className}`}
        >
            {children}
        </select>
    );
}
