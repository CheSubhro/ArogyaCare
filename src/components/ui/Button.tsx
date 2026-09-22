import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant =
    'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
    secondary: 'bg-[var(--color-secondary)] text-white hover:bg-blue-700',
    success: 'bg-[var(--color-success)] text-white hover:bg-green-700',
    danger: 'bg-[var(--color-danger)] text-white hover:bg-red-700',
    warning: 'bg-[var(--color-warning)] text-white hover:bg-amber-700',
    outline:
        'border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-slate-50',
    ghost: 'bg-transparent text-[var(--color-text)] hover:bg-slate-100',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    children,
    className = '',
    type = 'button',
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-lg
        font-medium
        transition-colors
        duration-200
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--color-primary)]
        focus:ring-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
            {...props}
        >
            {loading && (
                <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            )}

            {loading ? 'Loading...' : children}
        </button>
    );
}
