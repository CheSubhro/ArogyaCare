'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface RoleOption {
    name: string;
    description?: string;
    isSystemRole: boolean;
    isActive: boolean;
}

export default function NewUserPage() {
    const router = useRouter();

    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const [form, setForm] = useState({
        name: '',
        email: '',
        username: '',
        mobileNumber: '',
        password: '',
        confirmPassword: '',
        role: 'USER',
        accountStatus: 'ACTIVE',
    });

    useEffect(() => {
        const loadRoles = async () => {
            try {
                setLoadingRoles(true);
                setError('');

                const response = await fetch('/api/settings/roles', {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.message || 'Failed to load roles');
                    return;
                }

                const activeRoles = (data.roles || []).filter((role: RoleOption) => role.isActive);

                setRoles(activeRoles);
            } catch {
                setError('Something went wrong while loading roles');
            } finally {
                setLoadingRoles(false);
            }
        };

        loadRoles();
    }, []);

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [field]: [],
        }));

        setError('');
        setSuccess('');
    };

    const getFieldError = (field: string) => {
        return fieldErrors[field]?.[0] || '';
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSaving(true);
        setError('');
        setSuccess('');
        setFieldErrors({});

        try {
            const response = await fetch('/api/settings/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to create user');

                if (data.errors) {
                    setFieldErrors(data.errors);
                }

                return;
            }

            setSuccess('User created successfully.');

            setTimeout(() => {
                router.push(`/settings/users/${data.user.id}`);
            }, 700);
        } catch {
            setError('Something went wrong while creating user');
        } finally {
            setSaving(false);
        }
    };

    if (loadingRoles) {
        return (
            <div className="flex min-h-64 items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div>
                <button
                    type="button"
                    onClick={() => router.push('/settings/users')}
                    className="mb-3 text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Users
                </button>

                <h1 className="text-2xl font-semibold text-[var(--color-text)]">Add User</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Create a new staff or system user account.
                </p>
            </div>

            {error && (
                <Alert variant="danger">
                    <p className="text-sm">{error}</p>
                </Alert>
            )}

            {success && (
                <Alert variant="success">
                    <p className="text-sm">{success}</p>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Basic Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Enter the user's basic account information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Full Name
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Input
                                id="name"
                                value={form.name}
                                onChange={(event) => handleChange('name', event.target.value)}
                                placeholder="Enter full name"
                            />

                            {getFieldError('name') && (
                                <p className="mt-1 text-xs text-red-600">{getFieldError('name')}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Email
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(event) => handleChange('email', event.target.value)}
                                placeholder="Enter email address"
                            />

                            {getFieldError('email') && (
                                <p className="mt-1 text-xs text-red-600">
                                    {getFieldError('email')}
                                </p>
                            )}
                        </div>

                        {/* Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Username
                            </label>

                            <Input
                                id="username"
                                value={form.username}
                                onChange={(event) => handleChange('username', event.target.value)}
                                placeholder="Enter username"
                            />

                            {getFieldError('username') && (
                                <p className="mt-1 text-xs text-red-600">
                                    {getFieldError('username')}
                                </p>
                            )}
                        </div>

                        {/* Mobile */}
                        <div>
                            <label
                                htmlFor="mobileNumber"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Mobile Number
                            </label>

                            <Input
                                id="mobileNumber"
                                value={form.mobileNumber}
                                onChange={(event) =>
                                    handleChange('mobileNumber', event.target.value)
                                }
                                placeholder="Enter mobile number"
                            />

                            {getFieldError('mobileNumber') && (
                                <p className="mt-1 text-xs text-red-600">
                                    {getFieldError('mobileNumber')}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Password */}
                <Card>
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">Password</h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Set the initial password for this account.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Password
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(event) => handleChange('password', event.target.value)}
                                placeholder="Enter password"
                            />

                            {getFieldError('password') && (
                                <p className="mt-1 text-xs text-red-600">
                                    {getFieldError('password')}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Confirm Password
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Input
                                id="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={(event) =>
                                    handleChange('confirmPassword', event.target.value)
                                }
                                placeholder="Confirm password"
                            />

                            {getFieldError('confirmPassword') && (
                                <p className="mt-1 text-xs text-red-600">
                                    {getFieldError('confirmPassword')}
                                </p>
                            )}
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                        Password must contain at least 8 characters.
                    </p>
                </Card>

                {/* Role & Status */}
                <Card>
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Role & Account Status
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Assign the user's system role and account status.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {/* Role */}
                        <div>
                            <label
                                htmlFor="role"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Role
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Select
                                id="role"
                                value={form.role}
                                onChange={(event) => handleChange('role', event.target.value)}
                            >
                                {roles.length === 0 ? (
                                    <option value="">No active roles available</option>
                                ) : (
                                    roles.map((role) => (
                                        <option key={role.name} value={role.name}>
                                            {role.name
                                                .replaceAll('_', ' ')
                                                .replace(/\b\w/g, (char) => char.toUpperCase())}
                                        </option>
                                    ))
                                )}
                            </Select>

                            {getFieldError('role') && (
                                <p className="mt-1 text-xs text-red-600">{getFieldError('role')}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label
                                htmlFor="accountStatus"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Account Status
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Select
                                id="accountStatus"
                                value={form.accountStatus}
                                onChange={(event) =>
                                    handleChange('accountStatus', event.target.value)
                                }
                            >
                                <option value="ACTIVE">Active</option>

                                <option value="INACTIVE">Inactive</option>
                            </Select>

                            {getFieldError('accountStatus') && (
                                <p className="mt-1 text-xs text-red-600">
                                    {getFieldError('accountStatus')}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        onClick={() => router.push('/settings/users')}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button type="submit" variant="primary" disabled={saving || roles.length === 0}>
                        {saving ? 'Creating...' : 'Create User'}
                    </Button>
                </div>
            </form>
        </div>
    );
}