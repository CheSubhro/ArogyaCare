'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    username?: string;
    mobileNumber?: string;
    role: string;
    accountStatus: string;
    createdAt: string;
    updatedAt: string;
}

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
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

                    setError(data.message || 'Unable to load your profile.');

                    return;
                }

                setUser(data.user);
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [router]);

    const handleLogout = async () => {
        setError('');
        setLoggingOut(true);

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Unable to logout. Please try again.');

                return;
            }

            router.replace('/login');
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoggingOut(false);
        }
    };

    const formatDate = (date: string) => {
        if (!date) {
            return '—';
        }

        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(date));
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[var(--color-background)] p-6">
                <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
                    <Spinner />
                </div>
            </main>
        );
    }

    if (error && !user) {
        return (
            <main className="min-h-screen bg-[var(--color-background)] p-6">
                <div className="mx-auto max-w-5xl">
                    <Alert variant="danger">{error}</Alert>
                </div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen bg-[var(--color-background)] p-6">
            <div className="mx-auto max-w-5xl">
                {/* Page Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">My Profile</h1>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            View and manage your account information.
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="danger"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        {loggingOut ? 'Signing out...' : 'Logout'}
                    </Button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6">
                        <Alert variant="danger">{error}</Alert>
                    </div>
                )}

                {/* Profile Overview */}
                <Card className="mb-6">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            {/* Avatar */}
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </div>

                            {/* User Basic Information */}
                            <div className="flex-1">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <h2 className="text-2xl font-semibold text-[var(--color-text)]">
                                        {user.name}
                                    </h2>

                                    <Badge variant="success">{user.accountStatus}</Badge>
                                </div>

                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                    {user.email}
                                </p>

                                {user.username && (
                                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                        @{user.username}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Personal Information */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4 sm:px-8">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Personal Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Your registered account information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 sm:p-8">
                        <ProfileField label="Full Name" value={user.name} />

                        <ProfileField label="Email Address" value={user.email} />

                        <ProfileField label="Username" value={user.username || 'Not provided'} />

                        <ProfileField
                            label="Mobile Number"
                            value={user.mobileNumber || 'Not provided'}
                        />
                    </div>
                </Card>

                {/* Account Information */}
                <Card>
                    <div className="border-b border-[var(--color-border)] px-6 py-4 sm:px-8">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Account Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Your account status and system information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 sm:p-8">
                        {/* Role */}
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                Role
                            </p>

                            <div className="mt-2">
                                <Badge>{user.role}</Badge>
                            </div>
                        </div>

                        {/* Account Status */}
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                Account Status
                            </p>

                            <div className="mt-2">
                                <Badge variant="success">{user.accountStatus}</Badge>
                            </div>
                        </div>

                        {/* Created At */}
                        <ProfileField label="Account Created" value={formatDate(user.createdAt)} />

                        {/* Updated At */}
                        <ProfileField label="Last Updated" value={formatDate(user.updatedAt)} />
                    </div>
                </Card>
            </div>
        </main>
    );
}

interface ProfileFieldProps {
    label: string;
    value: string;
}

function ProfileField({ label, value }: ProfileFieldProps) {
    return (
        <div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>

            <p className="mt-1 break-words text-sm font-medium text-[var(--color-text)]">{value}</p>
        </div>
    );
}