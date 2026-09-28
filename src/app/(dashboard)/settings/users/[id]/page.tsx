'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface UserDetails {
    _id: string;
    name: string;
    email: string;
    username?: string;
    mobileNumber?: string;
    role: string;
    accountStatus: 'ACTIVE' | 'INACTIVE';
    emailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
}

function formatDate(value?: string) {
    if (!value) return 'Never';

    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getRoleBadgeVariant(role: string) {
    switch (role) {
        case 'SUPER_ADMIN':
            return 'danger';
        case 'ADMIN':
            return 'primary';
        case 'MANAGER':
            return 'info';
        case 'STAFF':
            return 'warning';
        default:
            return 'default';
    }
}

export default function UserDetailsPage() {
    const params = useParams();
    const id = params.id as string;

    const [user, setUser] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function fetchUser() {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`/api/settings/users/${id}`);

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || 'Failed to fetch user');
                return;
            }

            setUser(data.user);
        } catch (error) {
            console.error('Fetch user error:', error);
            setError('Something went wrong while fetching user');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) {
            fetchUser();
        }
    }, [id]);

    async function handleStatusChange() {
        if (!user) return;

        const nextStatus = user.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        const confirmed = window.confirm(
            nextStatus === 'INACTIVE'
                ? 'Are you sure you want to deactivate this user?'
                : 'Are you sure you want to activate this user?',
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            setError('');
            setSuccess('');

            const response = await fetch(`/api/settings/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountStatus: nextStatus,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || 'Failed to update user status');
                return;
            }

            setUser(data.user);
            setSuccess(
                nextStatus === 'INACTIVE'
                    ? 'User has been deactivated successfully.'
                    : 'User has been activated successfully.',
            );
        } catch (error) {
            console.error('Update user status error:', error);
            setError('Something went wrong while updating user status');
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="space-y-6">
                <Card>
                    <Alert variant="danger">{error || 'User not found'}</Alert>

                    <div className="mt-4">
                        <Link href="/settings/users">
                            <Button>Back to Users</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">User Details</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        View user account information and manage account status.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link href="/settings/users">
                        <Button>Back to Users</Button>
                    </Link>

                    <Link href={`/settings/users/${user._id}/edit`}>
                        <Button variant="primary">Edit User</Button>
                    </Link>

                    <Button
                        variant={user.accountStatus === 'ACTIVE' ? 'danger' : 'primary'}
                        onClick={handleStatusChange}
                        disabled={actionLoading}
                    >
                        {actionLoading
                            ? 'Updating...'
                            : user.accountStatus === 'ACTIVE'
                              ? 'Deactivate'
                              : 'Activate'}
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {error && <Alert variant="danger">{error}</Alert>}

            {success && <Alert variant="success">{success}</Alert>}

            {/* User Information */}
            <Card>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Account Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Basic information associated with this user account.
                        </p>
                    </div>

                    <Badge variant={user.accountStatus === 'ACTIVE' ? 'success' : 'danger'}>
                        {user.accountStatus}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Name</p>

                        <p className="mt-1 font-medium text-[var(--color-text)]">{user.name}</p>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Email</p>

                        <p className="mt-1 font-medium text-[var(--color-text)]">{user.email}</p>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Username</p>

                        <p className="mt-1 font-medium text-[var(--color-text)]">
                            {user.username || '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Mobile Number</p>

                        <p className="mt-1 font-medium text-[var(--color-text)]">
                            {user.mobileNumber || '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Role</p>

                        <div className="mt-2">
                            <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Account Status</p>

                        <div className="mt-2">
                            <Badge variant={user.accountStatus === 'ACTIVE' ? 'success' : 'danger'}>
                                {user.accountStatus}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Email Verification</p>

                        <div className="mt-2">
                            <Badge variant={user.emailVerified ? 'success' : 'warning'}>
                                {user.emailVerified ? 'VERIFIED' : 'NOT VERIFIED'}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Last Login</p>

                        <p className="mt-1 font-medium text-[var(--color-text)]">
                            {formatDate(user.lastLoginAt)}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Created At</p>

                        <p className="mt-1 font-medium text-[var(--color-text)]">
                            {formatDate(user.createdAt)}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">Last Updated</p>

                        <p className="mt-1 font-medium text-[var(--color-text)]">
                            {formatDate(user.updatedAt)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Account Management */}
            <Card>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    Account Management
                </h2>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Manage this user account from the available actions.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/settings/users/${user._id}/edit`}>
                        <Button variant="primary">Edit User</Button>
                    </Link>

                    <Button
                        variant={user.accountStatus === 'ACTIVE' ? 'danger' : 'primary'}
                        onClick={handleStatusChange}
                        disabled={actionLoading}
                    >
                        {actionLoading
                            ? 'Updating...'
                            : user.accountStatus === 'ACTIVE'
                              ? 'Deactivate Account'
                              : 'Activate Account'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
