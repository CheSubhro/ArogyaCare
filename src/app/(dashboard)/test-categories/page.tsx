'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface ParentCategory {
    _id: string;
    name: string;
    code: string;
}

interface TestCategory {
    _id: string;
    name: string;
    code: string;
    description?: string;
    department?: string;
    modality?: string;
    parentCategory?: ParentCategory | null;
    displayOrder: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

export default function TestCategoriesPage() {
    const router = useRouter();

    const [categories, setCategories] = useState<TestCategory[]>([]);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [department, setDepartment] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadCategories = async (searchValue = '', statusValue = '', departmentValue = '') => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams();

            if (searchValue.trim()) {
                params.set('search', searchValue.trim());
            }

            if (statusValue) {
                params.set('status', statusValue);
            }

            if (departmentValue) {
                params.set('department', departmentValue);
            }

            const query = params.toString() ? `?${params.toString()}` : '';

            const response = await fetch(`/api/test-categories${query}`, {
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

                setError(data.message || 'Unable to load test categories.');

                return;
            }

            setCategories(data.categories || []);
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await loadCategories(search, status, department);
    };

    const handleStatusChange = async (value: string) => {
        setStatus(value);

        await loadCategories(search, value, department);
    };

    const handleDepartmentChange = async (value: string) => {
        setDepartment(value);

        await loadCategories(search, status, value);
    };

    const handleClearFilters = async () => {
        setSearch('');
        setStatus('');
        setDepartment('');

        await loadCategories('', '', '');
    };

    const formatDate = (date: string) => {
        if (!date) {
            return '—';
        }

        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
        }).format(new Date(date));
    };

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Test Categories</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Manage diagnostic test categories, departments and modalities.
                    </p>
                </div>

                <Link href="/test-categories/new">
                    <Button type="button">+ Add Category</Button>
                </Link>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6">
                    <Alert variant="danger">{error}</Alert>
                </div>
            )}

            {/* Search & Filters */}
            <Card className="mb-6">
                <form onSubmit={handleSearch} className="p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by category name, code, department or modality"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <Select
                                value={status}
                                onChange={(event) => handleStatusChange(event.target.value)}
                            >
                                <option value="">All Status</option>

                                <option value="ACTIVE">Active</option>

                                <option value="INACTIVE">Inactive</option>
                            </Select>
                        </div>

                        {/* Department */}
                        <div>
                            <Select
                                value={department}
                                onChange={(event) => handleDepartmentChange(event.target.value)}
                            >
                                <option value="">All Departments</option>

                                <option value="Pathology">Pathology</option>

                                <option value="Radiology">Radiology</option>

                                <option value="Cardiology">Cardiology</option>

                                <option value="Vascular">Vascular</option>

                                <option value="Neurology">Neurology</option>

                                <option value="Special Procedures">Special Procedures</option>
                            </Select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-4 flex gap-2">
                        <Button type="submit" loading={loading}>
                            Search
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClearFilters}
                            disabled={loading}
                        >
                            Clear
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Test Category List */}
            <Card>
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Test Category List
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            {categories.length}{' '}
                            {categories.length !== 1 ? 'categories' : 'category'}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-64 items-center justify-center">
                        <Spinner />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                            🧪
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-[var(--color-text)]">
                            No test categories found
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
                            No test categories are available. Add a new category to get started.
                        </p>

                        <div className="mt-4">
                            <Link href="/test-categories/new">
                                <Button type="button">+ Add Category</Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--color-border)]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Code
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Category
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Department
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Modality
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Parent Category
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Status
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Created
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--color-border)] bg-white">
                                {categories.map((category) => (
                                    <tr key={category._id} className="hover:bg-slate-50">
                                        {/* Code */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="text-sm font-semibold text-[var(--color-primary)]">
                                                {category.code}
                                            </span>
                                        </td>

                                        {/* Category */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                                    {category.name}
                                                </p>

                                                {category.description && (
                                                    <p className="mt-1 max-w-xs truncate text-xs text-[var(--color-text-muted)]">
                                                        {category.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Department */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="text-sm text-[var(--color-text)]">
                                                {category.department || '—'}
                                            </span>
                                        </td>

                                        {/* Modality */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="text-sm text-[var(--color-text)]">
                                                {category.modality || '—'}
                                            </span>
                                        </td>

                                        {/* Parent Category */}
                                        <td className="px-6 py-4">
                                            {category.parentCategory ? (
                                                <div>
                                                    <p className="text-sm text-[var(--color-text)]">
                                                        {category.parentCategory.name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                        {category.parentCategory.code}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-[var(--color-text-muted)]">
                                                    Root Category
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {category.status === 'ACTIVE' ? (
                                                <Badge variant="success">Active</Badge>
                                            ) : (
                                                <Badge variant="warning">Inactive</Badge>
                                            )}
                                        </td>

                                        {/* Created */}
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                            {formatDate(category.createdAt)}
                                        </td>

                                        {/* Action */}
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <Link
                                                href={`/test-categories/${category._id}`}
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
                )}
            </Card>
        </div>
    );
}