'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';

interface DashboardUser {
    name: string;
    email: string;
}

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [user, setUser] = useState<DashboardUser | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await fetch('/api/auth/me', {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        router.replace('/login');
                        return;
                    }

                    return;
                }

                setUser(data.user);
            } catch {
                router.replace('/login');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
                <div className="text-sm text-[var(--color-text-muted)]">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-[var(--color-background)]">
            {/* Sidebar */}
            <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

            {/* Main Area */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <Header
                    onMenuClick={() => setMobileSidebarOpen(true)}
                    userName={user.name}
                    userEmail={user.email}
                />

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}
