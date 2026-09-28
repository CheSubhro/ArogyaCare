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

interface LabSampleReport {
    _id: string;
    sampleId: string;
    sampleType?: string;
    specimenSite?: string;
    collectionDateTime?: string;
    receivedDateTime?: string;
    status: string;
    rejectionReason?: string;
    remarks?: string;

    patient?: {
        _id: string;
        patientId: string;
        name: string;
        mobile?: string;
    };

    test?: {
        _id: string;
        name: string;
        code: string;
        testType?: string;
    };
}

interface Summary {
    totalSamples: number;
    pendingSamples: number;
    collectedSamples: number;
    receivedSamples: number;
    rejectedSamples: number;
    processedSamples: number;
    cancelledSamples: number;
}

interface ReportResponse {
    success: boolean;
    message?: string;

    summary: Summary;

    statusSummary: Record<string, number>;

    samples: LabSampleReport[];

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

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'PENDING':
            return 'Pending';

        case 'COLLECTED':
            return 'Collected';

        case 'RECEIVED':
            return 'Received';

        case 'REJECTED':
            return 'Rejected';

        case 'PROCESSED':
            return 'Processed';

        case 'CANCELLED':
            return 'Cancelled';

        default:
            return status;
    }
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'PENDING':
            return 'warning' as const;

        case 'COLLECTED':
            return 'info' as const;

        case 'RECEIVED':
            return 'primary' as const;

        case 'PROCESSED':
            return 'success' as const;

        case 'REJECTED':
            return 'danger' as const;

        case 'CANCELLED':
            return 'danger' as const;

        default:
            return 'default' as const;
    }
};

const formatDateTime = (value?: string) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function LabOperationsReportsPage() {
    const [preset, setPreset] = useState<DatePreset>('this-month');

    const [from, setFrom] = useState('');

    const [to, setTo] = useState('');

    const [search, setSearch] = useState('');

    const [status, setStatus] = useState('');

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

            if (status) {
                params.set('status', status);
            }

            params.set('page', String(targetPage));

            params.set('limit', String(limit));

            const response = await fetch(`/api/reports/lab-operations?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to load lab operations report.');
            }

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load lab operations report.');
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
    }, [from, to, search, status]);

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
                        Lab Operations Reports
                    </h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Monitor sample collection, receiving and processing operations.
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

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                            <label className="mb-1 block text-sm font-medium">Search</label>

                            <Input
                                placeholder="Sample ID, patient or test"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Sample Status</label>

                            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">All Status</option>

                                <option value="PENDING">Pending</option>

                                <option value="COLLECTED">Collected</option>

                                <option value="RECEIVED">Received</option>

                                <option value="REJECTED">Rejected</option>

                                <option value="PROCESSED">Processed</option>

                                <option value="CANCELLED">Cancelled</option>
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

            {loading && !data ? (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Total Samples</p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.totalSamples.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Pending</p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.pendingSamples.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Received</p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.receivedSamples.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Processed</p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.processedSamples.toLocaleString()}
                            </p>
                        </Card>
                    </div>

                    {/* Status Summary */}
                    <Card>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Sample Status Summary</h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Sample workflow status for the selected period.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                            {[
                                'PENDING',
                                'COLLECTED',
                                'RECEIVED',
                                'PROCESSED',
                                'REJECTED',
                                'CANCELLED',
                            ].map((sampleStatus) => (
                                <div
                                    key={sampleStatus}
                                    className="rounded-lg border border-[var(--color-border)] p-4"
                                >
                                    <Badge variant={getStatusVariant(sampleStatus)} size="sm">
                                        {getStatusLabel(sampleStatus)}
                                    </Badge>

                                    <p className="mt-3 text-2xl font-semibold">
                                        {(data.statusSummary[sampleStatus] || 0).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Sample Table */}
                    <Card>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Sample Operations</h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Sample-wise operational activity.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--color-border)]">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        <th className="px-4 py-3">Sample</th>

                                        <th className="px-4 py-3">Patient</th>

                                        <th className="px-4 py-3">Test</th>

                                        <th className="px-4 py-3">Sample Type</th>

                                        <th className="px-4 py-3">Collection</th>

                                        <th className="px-4 py-3">Status</th>

                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {data.samples.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]"
                                            >
                                                No sample activity found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.samples.map((sample) => (
                                            <tr key={sample._id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">{sample.sampleId}</p>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {sample.patient ? (
                                                        <div>
                                                            <Link
                                                                href={`/patients/${sample.patient._id}`}
                                                                className="font-medium text-[var(--color-primary)] hover:underline"
                                                            >
                                                                {sample.patient.name}
                                                            </Link>

                                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                                {sample.patient.patientId}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {sample.test ? (
                                                        <div>
                                                            <Link
                                                                href={`/tests/${sample.test._id}`}
                                                                className="font-medium text-[var(--color-primary)] hover:underline"
                                                            >
                                                                {sample.test.name}
                                                            </Link>

                                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                                {sample.test.code}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-sm">
                                                    {sample.sampleType || '-'}
                                                </td>

                                                <td className="px-4 py-3 text-sm">
                                                    {formatDateTime(sample.collectionDateTime)}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={getStatusVariant(sample.status)}
                                                        size="sm"
                                                    >
                                                        {getStatusLabel(sample.status)}
                                                    </Badge>

                                                    {sample.status === 'REJECTED' &&
                                                        sample.rejectionReason && (
                                                            <p className="mt-1 max-w-[180px] text-xs text-red-600">
                                                                {sample.rejectionReason}
                                                            </p>
                                                        )}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/lab-samples/${sample._id}`}
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