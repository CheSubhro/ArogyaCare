'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
    userName: string;
    userEmail: string;
}

export default function UserMenu({ userName, userEmail }: UserMenuProps) {
    const router = useRouter();

    const [open, setOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } finally {
            router.replace('/login');
        }
    };

    const initial = userName?.charAt(0).toUpperCase() || 'U';

    return (
        <div ref={menuRef} className="relative">
            {/* User Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
                aria-expanded={open}
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white">
                    {initial}
                </div>

                <div className="hidden text-left sm:block">
                    <p className="max-w-32 truncate text-sm font-medium text-[var(--color-text)]">
                        {userName}
                    </p>

                    <p className="max-w-32 truncate text-xs text-[var(--color-text-muted)]">
                        {userEmail}
                    </p>
                </div>

                {/* Chevron */}
                <svg
                    className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${
                        open ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                    <div className="border-b border-[var(--color-border)] px-4 py-3">
                        <p className="text-sm font-semibold text-[var(--color-text)]">{userName}</p>

                        <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                            {userEmail}
                        </p>
                    </div>

                    <div className="p-1">
                        <Link
                            href="/profile"
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm text-[var(--color-text)] hover:bg-slate-100"
                        >
                            My Profile
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full rounded-md px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}