'use client';

import UserMenu from '@/components/dashboard/UserMenu';

interface HeaderProps {
    onMenuClick: () => void;
    userName: string;
    userEmail: string;
}

export default function Header({ onMenuClick, userName, userEmail }: HeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
            {/* Left */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="rounded-lg p-2 text-[var(--color-text)] hover:bg-slate-100 lg:hidden"
                    aria-label="Open sidebar"
                >
                    <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>

                <div>
                    <h2 className="text-base font-semibold text-[var(--color-text)]">Dashboard</h2>

                    <p className="hidden text-xs text-[var(--color-text-muted)] sm:block">
                        ArogyaCare Diagnostics
                    </p>
                </div>
            </div>

            {/* Right */}
            <UserMenu userName={userName} userEmail={userEmail} />
        </header>
    );
}
