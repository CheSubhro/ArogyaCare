import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    title?: string;
    description?: string;
}

export default function Card({
    children,
    title,
    description,
    className = '',
    ...props
}: CardProps) {
    return (
        <div
            className={`
        rounded-xl
        border
        border-[var(--color-border)]
        bg-[var(--color-surface)]
        shadow-sm
        ${className}
      `}
            {...props}
        >
            {(title || description) && (
                <div className="border-b border-[var(--color-border)] px-5 py-4">
                    {title && (
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
                    )}

                    {description && (
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
                    )}
                </div>
            )}

            <div className="p-5">{children}</div>
        </div>
    );
}
