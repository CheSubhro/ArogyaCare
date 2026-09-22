'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    mobileOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
    },
    {
        label: 'Profile',
        href: '/profile',
    },
];

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center border-b border-[var(--color-border)] px-6">
                    <Link
                        href="/dashboard"
                        onClick={onClose}
                        className="text-lg font-bold text-[var(--color-primary)]"
                    >
                        ArogyaCare
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    {menuItems.map((item) => {
                        const isActive =
                            pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                                    isActive
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'text-[var(--color-text)] hover:bg-slate-100'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-[var(--color-border)] p-4">
                    <p className="text-xs text-[var(--color-text-muted)]">ArogyaCare Diagnostics</p>

                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">Management System</p>
                </div>
            </aside>
        </>
    );
}
