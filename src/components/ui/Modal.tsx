'use client';

import type { ReactNode } from 'react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <div
                className={`w-full ${sizeClasses[size]} rounded-xl bg-[var(--color-surface)] shadow-xl`}
                onClick={(event) => event.stopPropagation()}
            >
                {title && (
                    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                        <h2
                            id="modal-title"
                            className="text-lg font-semibold text-[var(--color-text)]"
                        >
                            {title}
                        </h2>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md p-1.5 text-xl leading-none text-[var(--color-text-muted)] transition-colors hover:bg-slate-100 hover:text-[var(--color-text)]"
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}
