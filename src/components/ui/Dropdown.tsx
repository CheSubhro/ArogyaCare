'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DropdownItem {
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
}

interface DropdownProps {
    trigger: ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
}

export default function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    function handleItemClick(item: DropdownItem) {
        if (item.disabled) {
            return;
        }

        item.onClick();
        setOpen(false);
    }

    return (
        <div ref={dropdownRef} className="relative inline-block">
            <div onClick={() => setOpen((previous) => !previous)} className="cursor-pointer">
                {trigger}
            </div>

            {open && (
                <div
                    className={`
            absolute
            top-full
            z-50
            mt-2
            min-w-48
            overflow-hidden
            rounded-lg
            border
            border-[var(--color-border)]
            bg-[var(--color-surface)]
            py-1
            shadow-lg
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
                >
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            disabled={item.disabled}
                            onClick={() => handleItemClick(item)}
                            className={`
                block
                w-full
                px-4
                py-2
                text-left
                text-sm
                transition-colors
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${
                    item.danger
                        ? 'text-[var(--color-danger)] hover:bg-red-50'
                        : 'text-[var(--color-text)] hover:bg-slate-50'
                }
              `}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
