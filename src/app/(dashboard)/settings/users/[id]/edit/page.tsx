'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface Role {
    _id: string;
    name: string;
    description?: string;
    isSystemRole: boolean;
    isActive: boolean;
}

interface UserData {
    _id: string;
    name: string;
    email: string;
    username?: string;
    mobileNumber?: string;
    role: string;
    accountStatus: 'ACTIVE' | 'INACTIVE';
}

interface FormData {
    name: string;
    email: string;
    username: string;
    mobileNumber: string;
    role: string;
    accountStatus: 'ACTIVE' | 'INACTIVE';
    password: string;
    confirmPassword: string;
}

interface FieldErrors {
    [key: string]: string[];
}

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();

    const id = params.id as string;

    const [user, setUser] = useState<UserData | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        username: '',
        mobileNumber: '',
        role: '',
        accountStatus: 'ACTIVE',
        password: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    async function fetchData() {
        try {
            setLoading(true);
            setError('');

            const [userResponse, rolesResponse] = await Promise.all([
                fetch(`/api/settings/users/${id}`),
                fetch('/api/settings/roles'),
            ]);

            const userData = await userResponse.json();
            const rolesData = await rolesResponse.json();

            if (!userResponse.ok || !userData.success) {
                setError(userData.message || 'Failed to fetch user');
                return;
            }

            if (!rolesResponse.ok || !rolesData.success) {
                setError(rolesData.message || 'Failed to fetch roles');
                return;
            }

            const currentUser = userData.user as UserData;
            const activeRoles = (rolesData.roles as Role[]).filter((role) => role.isActive);

            setUser(currentUser);
            setRoles(activeRoles);

            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                username: currentUser.username || '',
                mobileNumber: currentUser.mobileNumber || '',
                role: currentUser.role || '',
                accountStatus: currentUser.accountStatus || 'ACTIVE',
                password: '',
                confirmPassword: '',
            });
        } catch (error) {
            console.error('Fetch edit user data error:', error);
            setError('Something went wrong while loading user information');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (fieldErrors[name]) {
            setFieldErrors((previous) => {
                const updated = { ...previous };
                delete updated[name];
                return updated;
            });
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSaving(true);
        setError('');
        setFieldErrors({});

        try {
            const body: Record<string, string> = {
                name: formData.name,
                email: formData.email,
                username: formData.username,
                mobileNumber: formData.mobileNumber,
                role: formData.role,
                accountStatus: formData.accountStatus,
            };

            /*
             * Password is optional.
             * Only send password fields when the admin wants
             * to change the user's password.
             */
            if (formData.password || formData.confirmPassword) {
                body.password = formData.password;
                body.confirmPassword = formData.confirmPassword;
            }

            const response = await fetch(`/api/settings/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                if (data.errors) {
                    setFieldErrors(data.errors);
                }

                setError(data.message || 'Failed to update user');
                return;
            }

            router.push(`/settings/users/${id}`);
            router.refresh();
        } catch (error) {
            console.error('Update user error:', error);
            setError('Something went wrong while updating user');
        } finally {
            setSaving(false);
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
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Edit User</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Update user information, role, account status, or password.
                    </p>
                </div>

                <Link href={`/settings/users/${id}`}>
                    <Button>Back to User</Button>
                </Link>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Basic Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update the user's basic account information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Full Name" required error={fieldErrors.name?.[0]}>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                required
                            />
                        </FormField>

                        <FormField label="Email Address" required error={fieldErrors.email?.[0]}>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address"
                                required
                            />
                        </FormField>

                        <FormField label="Username" error={fieldErrors.username?.[0]}>
                            <Input
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter username"
                            />
                        </FormField>

                        <FormField label="Mobile Number" error={fieldErrors.mobileNumber?.[0]}>
                            <Input
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                placeholder="Enter mobile number"
                            />
                        </FormField>
                    </div>
                </Card>

                {/* Role & Status */}
                <Card>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Role & Account Status
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Control the user's role and account access.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Role" required error={fieldErrors.role?.[0]}>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select role</option>

                                {roles.map((role) => (
                                    <option key={role._id} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        <FormField
                            label="Account Status"
                            required
                            error={fieldErrors.accountStatus?.[0]}
                        >
                            <Select
                                name="accountStatus"
                                value={formData.accountStatus}
                                onChange={handleChange}
                                required
                            >
                                <option value="ACTIVE">ACTIVE</option>

                                <option value="INACTIVE">INACTIVE</option>
                            </Select>
                        </FormField>
                    </div>
                </Card>

                {/* Password */}
                <Card>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Change Password
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Leave both fields empty if you do not want to change the password.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="New Password" error={fieldErrors.password?.[0]}>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                            />
                        </FormField>

                        <FormField
                            label="Confirm New Password"
                            error={fieldErrors.confirmPassword?.[0]}
                        >
                            <Input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                            />
                        </FormField>
                    </div>

                    <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-slate-50 p-4">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Password must be at least 8 characters. The password will be securely
                            hashed before being stored.
                        </p>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap justify-end gap-3">
                    <Link href={`/settings/users/${id}`}>
                        <Button type="button">Cancel</Button>
                    </Link>

                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}