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

interface TestReport {
    _id: string;
    testName: string;
    testCode: string;
    category?: string;
    department?: string;
    modality?: string;
    testType?: string;
    totalTests: number;
    billCount: number;
}

interface Summary {
    totalTestsPerformed: number;
    totalUniqueTests: number;
    laboratoryTests: number;
    imagingTests: number;
    cardiologyTests: number;
    neurologyTests: number;
    procedureTests: number;
    otherTests: number;
}

interface ReportResponse {
    success: boolean;
    message?: string;
    summary: Summary;
    tests: TestReport[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

type DatePreset = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'last-month' | 'custom';

const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getDateRange = (preset: DatePreset) => {
    const now = new Date();

    if (preset === 'today') {
        const date = formatDateInput(now);

        return {
            from: date,
            to: date,
        };
    }

    if (preset === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        const date = formatDateInput(yesterday);

        return {
            from: date,
            to: date,
        };
    }

    if (preset === 'this-week') {
        const day = now.getDay();

        const start = new Date(now);
        start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));

        return {
            from: formatDateInput(start),
            to: formatDateInput(now),
        };
    }

    if (preset === 'last-month') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const end = new Date(now.getFullYear(), now.getMonth(), 0);

        return {
            from: formatDateInput(start),
            to: formatDateInput(end),
        };
    }

    return {
        from: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: formatDateInput(now),
    };
};

const getTestTypeLabel = (value?: string) => {
    switch (value) {
        case 'LABORATORY':
            return 'Laboratory';

        case 'IMAGING':
            return 'Imaging';

        case 'CARDIOLOGY':
            return 'Cardiology';

        case 'NEUROLOGY':
            return 'Neurology';

        case 'PROCEDURE':
            return 'Procedure';

        default:
            return 'Other';
    }
};

const getTestTypeVariant = (value?: string) => {
    switch (value) {
        case 'LABORATORY':
            return 'primary' as const;

        case 'IMAGING':
            return 'info' as const;

        case 'CARDIOLOGY':
            return 'success' as const;

        case 'NEUROLOGY':
            return 'warning' as const;

        case 'PROCEDURE':
            return 'danger' as const;

        default:
            return 'default' as const;
    }
};

export default function TestReportsPage() {
    const [preset, setPreset] = useState<DatePreset>('this-month');

    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [search, setSearch] = useState('');

    const [department, setDepartment] = useState('');

    const [testType, setTestType] = useState('');

    const [data, setData] = useState<ReportResponse | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [page, setPage] = useState(1);

    const limit = 10;

    const loadReport = async (targetPage = page) => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams();

            if (from) {
                params.set('from', from);
            }

            if (to) {
                params.set('to', to);
            }

            if (search.trim()) {
                params.set('search', search.trim());
            }

            if (department) {
                params.set('department', department);
            }

            if (testType) {
                params.set('testType', testType);
            }

            params.set('page', String(targetPage));

            params.set('limit', String(limit));

            const response = await fetch(`/api/reports/tests?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to load test report.');
            }

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load test report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const range = getDateRange(preset);

        setFrom(range.from);
        setTo(range.to);
    }, [preset]);

    useEffect(() => {
        if (!from || !to) {
            return;
        }

        loadReport(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, search, department, testType]);

    const handleCustomDateChange = (type: 'from' | 'to', value: string) => {
        setPreset('custom');

        if (type === 'from') {
            setFrom(value);
        } else {
            setTo(value);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--color-text)]">
                        Test Reports
                    </h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        View test-wise diagnostic activity and performance.
                    </p>
                </div>

                <Link href="/reports">
                    <Button type="button">Back to Reports</Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {[
                            ['today', 'Today'],
                            ['yesterday', 'Yesterday'],
                            ['this-week', 'This Week'],
                            ['this-month', 'This Month'],
                            ['last-month', 'Last Month'],
                        ].map(([value, label]) => (
                            <Button
                                key={value}
                                type="button"
                                variant={preset === value ? 'primary' : undefined}
                                onClick={() => setPreset(value as DatePreset)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <label className="mb-1 block text-sm font-medium">From</label>

                            <Input
                                type="date"
                                value={from}
                                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">To</label>

                            <Input
                                type="date"
                                value={to}
                                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Search Test</label>

                            <Input
                                placeholder="Name or code"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Department</label>

                            <Select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                            >
                                <option value="">All Departments</option>
                                <option value="Laboratory">Laboratory</option>
                                <option value="Radiology">Radiology</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Neurology">Neurology</option>
                                <option value="Other">Other</option>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Test Type</label>

                            <Select value={testType} onChange={(e) => setTestType(e.target.value)}>
                                <option value="">All Test Types</option>
                                <option value="LABORATORY">Laboratory</option>
                                <option value="IMAGING">Imaging</option>
                                <option value="CARDIOLOGY">Cardiology</option>
                                <option value="NEUROLOGY">Neurology</option>
                                <option value="PROCEDURE">Procedure</option>
                                <option value="OTHER">Other</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </Card>

            {error && (
                <Alert variant="danger">
                    <p className="text-sm">{error}</p>
                </Alert>
            )}

            {/* Summary */}
            {loading && !data ? (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            ) : data ? (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Tests Performed
                            </p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.totalTestsPerformed.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Unique Tests</p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.totalUniqueTests.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Laboratory</p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.laboratoryTests.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Imaging</p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.imagingTests.toLocaleString()}
                            </p>
                        </Card>
                    </div>

                    {/* Additional Test Type Summary */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Cardiology</p>

                            <p className="mt-2 text-xl font-semibold">
                                {data.summary.cardiologyTests.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Neurology</p>

                            <p className="mt-2 text-xl font-semibold">
                                {data.summary.neurologyTests.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Procedures</p>

                            <p className="mt-2 text-xl font-semibold">
                                {data.summary.procedureTests.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Other</p>

                            <p className="mt-2 text-xl font-semibold">
                                {data.summary.otherTests.toLocaleString()}
                            </p>
                        </Card>
                    </div>

                    {/* Test Table */}
                    <Card>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Test-wise Summary</h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Test activity for the selected period.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--color-border)]">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        <th className="px-4 py-3">Test</th>

                                        <th className="px-4 py-3">Category</th>

                                        <th className="px-4 py-3">Department</th>

                                        <th className="px-4 py-3">Type</th>

                                        <th className="px-4 py-3 text-right">Tests</th>

                                        <th className="px-4 py-3 text-right">Bills</th>

                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {data.tests.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]"
                                            >
                                                No test activity found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.tests.map((test) => (
                                            <tr key={test._id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            {test.testName}
                                                        </p>

                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {test.testCode}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-sm">
                                                    {test.category || '-'}
                                                </td>

                                                <td className="px-4 py-3 text-sm">
                                                    {test.department || '-'}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={getTestTypeVariant(test.testType)}
                                                        size="sm"
                                                    >
                                                        {getTestTypeLabel(test.testType)}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3 text-right text-sm font-semibold">
                                                    {test.totalTests.toLocaleString()}
                                                </td>

                                                <td className="px-4 py-3 text-right text-sm">
                                                    {test.billCount.toLocaleString()}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/tests/${test._id}`}
                                                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data.pagination.totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Page {data.pagination.page} of {data.pagination.totalPages}
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => {
                                            const nextPage = page - 1;

                                            setPage(nextPage);

                                            loadReport(nextPage);
                                        }}
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        type="button"
                                        disabled={page >= data.pagination.totalPages}
                                        onClick={() => {
                                            const nextPage = page + 1;

                                            setPage(nextPage);

                                            loadReport(nextPage);
                                        }}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </>
            ) : null}
        </div>
    );
}