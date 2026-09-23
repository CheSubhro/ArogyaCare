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

interface TestCategory {
    _id: string;
    name: string;
    code: string;
    department?: string;
    modality?: string;
}

interface Test {
    _id: string;
    name: string;
    code: string;
    category: TestCategory;
    department?: string;
    testType: 'LABORATORY' | 'IMAGING' | 'CARDIOLOGY' | 'NEUROLOGY' | 'PROCEDURE' | 'OTHER';
    sampleType?: string;
    specimenSite?: string;
    modality?: string;
    preparationRequired: boolean;
    turnaroundTime?: number;
    turnaroundUnit: 'MINUTES' | 'HOURS' | 'DAYS';
    price: number;
    discountAllowed: boolean;
    reportType: 'NUMERIC' | 'TEXT' | 'STRUCTURED' | 'IMAGING' | 'MIXED';
    displayOrder: number;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

const departments = [
    'Pathology',
    'Radiology',
    'Cardiology',
    'Vascular',
    'Neurology',
    'Special Procedures',
];

const testTypes = [
    {
        value: 'LABORATORY',
        label: 'Laboratory',
    },
    {
        value: 'IMAGING',
        label: 'Imaging',
    },
    {
        value: 'CARDIOLOGY',
        label: 'Cardiology',
    },
    {
        value: 'NEUROLOGY',
        label: 'Neurology',
    },
    {
        value: 'PROCEDURE',
        label: 'Procedure',
    },
    {
        value: 'OTHER',
        label: 'Other',
    },
];

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(price);
};

const formatTurnaroundTime = (value?: number, unit?: 'MINUTES' | 'HOURS' | 'DAYS') => {
    if (value === undefined || value === null) {
        return '—';
    }

    const unitLabels = {
        MINUTES: value === 1 ? 'minute' : 'minutes',
        HOURS: value === 1 ? 'hour' : 'hours',
        DAYS: value === 1 ? 'day' : 'days',
    };

    return `${value} ${unitLabels[unit || 'HOURS']}`;
};

const getTestTypeLabel = (testType: Test['testType']) => {
    const item = testTypes.find((type) => type.value === testType);

    return item?.label || testType;
};

export default function TestsPage() {
    const router = useRouter();

    const [tests, setTests] = useState<Test[]>([]);
    const [categories, setCategories] = useState<TestCategory[]>([]);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [department, setDepartment] = useState('');
    const [testType, setTestType] = useState('');
    const [category, setCategory] = useState('');

    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const [error, setError] = useState('');

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setCategoriesLoading(true);

                const response = await fetch('/api/test-categories?status=ACTIVE', {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });

                const data = await response.json();

                if (response.status === 401) {
                    router.replace('/login');
                    return;
                }

                if (!response.ok) {
                    setError(data.message || 'Unable to load test categories.');
                    return;
                }

                setCategories(data.categories || []);
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setCategoriesLoading(false);
            }
        };

        loadCategories();
    }, [router]);

    useEffect(() => {
        const loadTests = async () => {
            try {
                setLoading(true);
                setError('');

                const params = new URLSearchParams();

                if (search.trim()) {
                    params.set('search', search.trim());
                }

                if (status) {
                    params.set('status', status);
                }

                if (department) {
                    params.set('department', department);
                }

                if (testType) {
                    params.set('testType', testType);
                }

                if (category) {
                    params.set('category', category);
                }

                const queryString = params.toString();

                const response = await fetch(`/api/tests${queryString ? `?${queryString}` : ''}`, {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });

                const data = await response.json();

                if (response.status === 401) {
                    router.replace('/login');
                    return;
                }

                if (!response.ok) {
                    setError(data.message || 'Unable to load tests.');
                    return;
                }

                setTests(data.tests || []);
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadTests();
    }, [search, status, department, testType, category, router]);

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setDepartment('');
        setTestType('');
        setCategory('');
    };

    const hasFilters = search || status || department || testType || category;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Tests</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Manage diagnostic tests and services.
                    </p>
                </div>

                <Link href="/tests/new">
                    <Button>+ Add Test</Button>
                </Link>
            </div>

            {/* Error */}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Filters */}
            <Card>
                <div className="grid gap-4 lg:grid-cols-5">
                    <div className="lg:col-span-2">
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
                            placeholder="Search by test name, code, sample, modality..."
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="category"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Category
                        </label>

                        <Select
                            id="category"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            disabled={categoriesLoading}
                        >
                            <option value="">All Categories</option>

                            {categories.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.name} ({item.code})
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label
                            htmlFor="department"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Department
                        </label>

                        <Select
                            id="department"
                            value={department}
                            onChange={(event) => setDepartment(event.target.value)}
                        >
                            <option value="">All Departments</option>

                            {departments.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label
                            htmlFor="testType"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Test Type
                        </label>

                        <Select
                            id="testType"
                            value={testType}
                            onChange={(event) => setTestType(event.target.value)}
                        >
                            <option value="">All Types</option>

                            {testTypes.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="w-full sm:w-48">
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
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </Select>
                    </div>

                    {hasFilters && (
                        <div className="pt-6">
                            <Button type="button" variant="secondary" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Test List */}
            <Card className="overflow-hidden p-0">
                <div className="border-b border-[var(--color-border)] px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--color-text)]">
                                Test List
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                {loading
                                    ? 'Loading tests...'
                                    : `${tests.length} test${tests.length === 1 ? '' : 's'} found`}
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-[250px] items-center justify-center">
                        <Spinner />
                    </div>
                ) : tests.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-sm font-medium text-[var(--color-text)]">
                            No tests found.
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Try changing your search or filter criteria.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] bg-slate-50">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Code
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Test
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Category
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Department
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Type
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Turnaround
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Price
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Status
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {tests.map((test) => (
                                    <tr
                                        key={test._id}
                                        className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-4 text-sm font-semibold text-[var(--color-primary)]">
                                            {test.code}
                                        </td>

                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                                    {test.name}
                                                </p>

                                                {test.modality && (
                                                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                        {test.modality}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text)]">
                                                    {test.category?.name}
                                                </p>

                                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                    {test.category?.code}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-sm text-[var(--color-text)]">
                                            {test.department || '—'}
                                        </td>

                                        <td className="px-4 py-4 text-sm text-[var(--color-text)]">
                                            {getTestTypeLabel(test.testType)}
                                        </td>

                                        <td className="px-4 py-4 text-sm text-[var(--color-text)]">
                                            {formatTurnaroundTime(
                                                test.turnaroundTime,
                                                test.turnaroundUnit,
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-sm font-semibold text-[var(--color-text)]">
                                            {formatPrice(test.price)}
                                        </td>

                                        <td className="px-4 py-4">
                                            <Badge
                                                variant={
                                                    test.status === 'ACTIVE' ? 'success' : 'warning'
                                                }
                                            >
                                                {test.status}
                                            </Badge>
                                        </td>

                                        <td className="px-4 py-4">
                                            <Link
                                                href={`/tests/${test._id}`}
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
