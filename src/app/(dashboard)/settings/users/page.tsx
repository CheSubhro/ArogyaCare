'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface User {
    _id: string;
    name: string;
    email: string;
    username?: string;
    mobileNumber?: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER';
    accountStatus: 'ACTIVE' | 'INACTIVE';
    lastLoginAt?: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'USER', label: 'User' },
];

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
];

function formatDate(value?: string) {
    if (!value) {
        return 'Never';
    }

    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatDateTime(value?: string) {
    if (!value) {
        return 'Never';
    }

    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getRoleLabel(role: User['role']) {
    switch (role) {
        case 'SUPER_ADMIN':
            return 'Super Admin';
        case 'ADMIN':
            return 'Admin';
        case 'MANAGER':
            return 'Manager';
        case 'STAFF':
            return 'Staff';
        default:
            return 'User';
    }
}

function getRoleBadgeVariant(role: User['role']) {
    switch (role) {
        case 'SUPER_ADMIN':
            return 'danger' as const;
        case 'ADMIN':
            return 'primary' as const;
        case 'MANAGER':
            return 'info' as const;
        case 'STAFF':
            return 'warning' as const;
        default:
            return 'default' as const;
    }
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadUsers = async (page = pagination.page) => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams();

            if (search.trim()) {
                params.set('search', search.trim());
            }

            if (role) {
                params.set('role', role);
            }

            if (status) {
                params.set('status', status);
            }

            params.set('page', String(page));
            params.set('limit', String(pagination.limit));

            const response = await fetch(`/api/settings/users?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to load users');
                return;
            }

            setUsers(data.users || []);
            setPagination(
                data.pagination || {
                    page,
                    limit: pagination.limit,
                    total: 0,
                    totalPages: 0,
                },
            );
        } catch {
            setError('Something went wrong while loading users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        loadUsers(1);
    };

    const handleReset = () => {
        setSearch('');
        setRole('');
        setStatus('');

        setTimeout(() => {
            loadUsers(1);
        }, 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--color-text)]">
                        Users & Staff
                    </h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Manage system users, staff accounts, roles and account status.
                    </p>
                </div>

                <Link href="/settings/users/new">
                    <Button variant="primary">+ Add User</Button>
                </Link>
            </div>

            {/* Error */}
            {error && (
                <Alert variant="danger">
                    <p className="text-sm">{error}</p>
                </Alert>
            )}

            {/* Filters */}
            <Card>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <label
                            htmlFor="search"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Search
                        </label>

                        <Input
                            id="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                            placeholder="Name, email, username or mobile"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="role"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Role
                        </label>

                        <Select
                            id="role"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                        >
                            {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label
                            htmlFor="status"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Status
                        </label>

                        <Select
                            id="status"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="primary" onClick={handleSearch}>
                        Search
                    </Button>

                    <Button onClick={handleReset}>Reset</Button>
                </div>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <p className="text-sm text-[var(--color-text-muted)]">Total Users</p>

                    <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                        {pagination.total}
                    </p>
                </Card>

                <Card>
                    <p className="text-sm text-[var(--color-text-muted)]">Showing</p>

                    <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                        {users.length}
                    </p>
                </Card>

                <Card>
                    <p className="text-sm text-[var(--color-text-muted)]">Current Page</p>

                    <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                        {pagination.page} / {pagination.totalPages || 1}
                    </p>
                </Card>
            </div>

            {/* Table */}
            <Card className="overflow-hidden p-0">
                {loading ? (
                    <div className="flex min-h-64 items-center justify-center">
                        <Spinner />
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex min-h-64 items-center justify-center px-6 text-center">
                        <div>
                            <p className="font-medium text-[var(--color-text)]">No users found</p>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Try changing your search or filters.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-[var(--color-border)] bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                                            Name
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                                            Username / Email
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                                            Mobile
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                                            Role
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                                            Last Login
                                        </th>

                                        <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">
                                            Created
                                        </th>

                                        <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-[var(--color-text)]">
                                                    {user.name}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="text-[var(--color-text)]">
                                                    {user.username || '—'}
                                                </div>

                                                <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                                    {user.email}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-[var(--color-text-muted)]">
                                                {user.mobileNumber || '—'}
                                            </td>

                                            <td className="px-4 py-3">
                                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                                    {getRoleLabel(user.role)}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        user.accountStatus === 'ACTIVE'
                                                            ? 'success'
                                                            : 'danger'
                                                    }
                                                >
                                                    {user.accountStatus}
                                                </Badge>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-muted)]">
                                                {formatDateTime(user.lastLoginAt)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-muted)]">
                                                {formatDate(user.createdAt)}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/settings/users/${user._id}`}
                                                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Page {pagination.page} of {pagination.totalPages}
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        disabled={pagination.page <= 1}
                                        onClick={() => loadUsers(pagination.page - 1)}
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => loadUsers(pagination.page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}
