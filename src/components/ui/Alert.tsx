import type { ReactNode } from 'react';

type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: ReactNode;
    onClose?: () => void;
}

const variantClasses: Record<AlertVariant, string> = {
    success: 'border-green-200 bg-green-50 text-green-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const iconClasses: Record<AlertVariant, string> = {
    success: '✓',
    warning: '!',
    danger: '×',
    info: 'i',
};

export default function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
    return (
        <div
            role="alert"
            className={`
        flex
        items-start
        gap-3
        rounded-lg
        border
        p-4
        ${variantClasses[variant]}
      `}
        >
            <span
                className="
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-current/10
          text-xs
          font-bold
        "
                aria-hidden="true"
            >
                {iconClasses[variant]}
            </span>

            <div className="min-w-0 flex-1">
                {title && <h3 className="text-sm font-semibold">{title}</h3>}

                <div className={title ? 'mt-1 text-sm' : 'text-sm'}>{children}</div>
            </div>

            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-md p-1 text-lg leading-none opacity-70 transition-opacity hover:opacity-100"
                    aria-label="Close alert"
                >
                    ×
                </button>
            )}
        </div>
    );
}
