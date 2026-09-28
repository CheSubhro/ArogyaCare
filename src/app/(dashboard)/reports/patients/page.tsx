'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface PatientReport {
    _id: string;
    patientId: string;
    name: string;
    gender: string;
    dob?: string;
    age?: number;
    mobile?: string;
    email?: string;
    city?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    totalBills: number;
    totalTests: number;
}

interface PatientReportData {
    summary: {
        totalPatients: number;
        newPatients: number;
        activePatients: number;
        inactivePatients: number;
    };

    patients: PatientReport[];

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

type DatePreset = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

function getDateString(date: Date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getDateRange(preset: DatePreset) {
    const today = new Date();

    if (preset === 'TODAY') {
        const date = getDateString(today);

        return {
            from: date,
            to: date,
        };
    }

    if (preset === 'THIS_WEEK') {
        const day = today.getDay();

        const difference = day === 0 ? 6 : day - 1;

        const monday = new Date(today);

        monday.setDate(today.getDate() - difference);

        return {
            from: getDateString(monday),
            to: getDateString(today),
        };
    }

    if (preset === 'LAST_MONTH') {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

        return {
            from: getDateString(firstDay),
            to: getDateString(lastDay),
        };
    }

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
        from: getDateString(firstDay),
        to: getDateString(lastDay),
    };
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function PatientReportsPage() {
    const initialRange = getDateRange('THIS_MONTH');

    const [data, setData] = useState<PatientReportData | null>(null);

    const [preset, setPreset] = useState<DatePreset>('THIS_MONTH');

    const [fromDate, setFromDate] = useState(initialRange.from);

    const [toDate, setToDate] = useState(initialRange.to);

    const [search, setSearch] = useState('');

    const [status, setStatus] = useState('');

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const loadReport = async (selectedPage = 1, selectedFrom = fromDate, selectedTo = toDate) => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams({
                from: selectedFrom,
                to: selectedTo,
                page: String(selectedPage),
                limit: '10',
            });

            if (search.trim()) {
                params.set('search', search.trim());
            }

            if (status) {
                params.set('status', status);
            }

            const response = await fetch(`/api/reports/patients?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to load patient report.');
            }

            setData(result);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load patient report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport(1);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePresetChange = (value: DatePreset) => {
        setPreset(value);

        if (value === 'CUSTOM') {
            return;
        }

        const range = getDateRange(value);

        setFromDate(range.from);
        setToDate(range.to);
        setPage(1);

        loadReport(1, range.from, range.to);
    };

    const handleApply = () => {
        if (!fromDate || !toDate) {
            setError('Please select both dates.');
            return;
        }

        if (fromDate > toDate) {
            setError('From date cannot be after To date.');
            return;
        }

        setPage(1);

        loadReport(1);
    };

    const handleFilter = () => {
        setPage(1);
        loadReport(1);
    };

    const handleReset = () => {
        const range = getDateRange('THIS_MONTH');

        setPreset('THIS_MONTH');
        setFromDate(range.from);
        setToDate(range.to);
        setSearch('');
        setStatus('');
        setPage(1);

        loadReport(1, range.from, range.to);
    };

    const handlePageChange = (nextPage: number) => {
        if (!data || nextPage < 1 || nextPage > data.pagination.totalPages) {
            return;
        }

        setPage(nextPage);
        loadReport(nextPage);
    };

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/reports"
                    className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Reports
                </Link>

                <h1 className="text-2xl font-bold text-[var(--color-text)]">Patient Reports</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Patient registration and diagnostic visit summary.
                </p>
            </div>

            {error && (
                <Alert variant="danger">
                    <p className="text-sm">{error}</p>
                </Alert>
            )}

            <Card>
                <div className="grid gap-4 lg:grid-cols-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Period</label>

                        <select
                            value={preset}
                            onChange={(event) =>
                                handlePresetChange(event.target.value as DatePreset)
                            }
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
                        >
                            <option value="TODAY">Today</option>

                            <option value="THIS_WEEK">This Week</option>

                            <option value="THIS_MONTH">This Month</option>

                            <option value="LAST_MONTH">Last Month</option>

                            <option value="CUSTOM">Custom</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">From</label>

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(event) => setFromDate(event.target.value)}
                            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">To</label>

                        <input
                            type="date"
                            value={toDate}
                            onChange={(event) => setToDate(event.target.value)}
                            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div className="flex items-end">
                        <Button type="button" variant="primary" onClick={handleApply}>
                            Apply
                        </Button>
                    </div>

                    <div className="flex items-end">
                        <Button type="button" onClick={handleReset}>
                            Reset
                        </Button>
                    </div>
                </div>

                <div className="mt-4 grid gap-4 border-t border-[var(--color-border)] pt-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium">Search Patient</label>

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    handleFilter();
                                }
                            }}
                            placeholder="Patient ID, name or mobile..."
                            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Status</label>

                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm"
                        >
                            <option value="">All</option>

                            <option value="ACTIVE">Active</option>

                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <Button type="button" variant="primary" onClick={handleFilter}>
                            Filter
                        </Button>

                        <Button type="button" onClick={handleReset}>
                            Clear
                        </Button>
                    </div>
                </div>
            </Card>

            {loading && !data ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Spinner />
                </div>
            ) : data ? (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Total Patients</p>

                            <p className="mt-2 text-2xl font-bold">{data.summary.totalPatients}</p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">New Patients</p>

                            <p className="mt-2 text-2xl font-bold text-blue-700">
                                {data.summary.newPatients}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                Registered during selected period
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Active Patients
                            </p>

                            <p className="mt-2 text-2xl font-bold text-green-700">
                                {data.summary.activePatients}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Inactive Patients
                            </p>

                            <p className="mt-2 text-2xl font-bold text-red-700">
                                {data.summary.inactivePatients}
                            </p>
                        </Card>
                    </div>

                    <Card className="overflow-hidden p-0">
                        <div className="border-b border-[var(--color-border)] p-5">
                            <h2 className="text-lg font-semibold">Patient Summary</h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                {data.pagination.total} patient
                                {data.pagination.total !== 1 ? 's' : ''} found.
                            </p>
                        </div>

                        {data.patients.length === 0 ? (
                            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
                                No patients found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[950px] text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold">
                                                Patient
                                            </th>

                                            <th className="px-4 py-3 text-left font-semibold">
                                                Gender / Age
                                            </th>

                                            <th className="px-4 py-3 text-left font-semibold">
                                                Mobile
                                            </th>

                                            <th className="px-4 py-3 text-center font-semibold">
                                                Bills / Visits
                                            </th>

                                            <th className="px-4 py-3 text-center font-semibold">
                                                Tests
                                            </th>

                                            <th className="px-4 py-3 text-left font-semibold">
                                                Registered
                                            </th>

                                            <th className="px-4 py-3 text-center font-semibold">
                                                Status
                                            </th>

                                            <th className="px-4 py-3 text-right font-semibold">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {data.patients.map((patient) => (
                                            <tr
                                                key={patient._id}
                                                className="border-t border-[var(--color-border)]"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="font-medium">
                                                        {patient.name}
                                                    </div>

                                                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                        {patient.patientId}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    {patient.gender}

                                                    {patient.age !== undefined &&
                                                        ` / ${patient.age} yrs`}
                                                </td>

                                                <td className="px-4 py-4">
                                                    {patient.mobile || '—'}
                                                </td>

                                                <td className="px-4 py-4 text-center font-medium">
                                                    {patient.totalBills}
                                                </td>

                                                <td className="px-4 py-4 text-center font-medium">
                                                    {patient.totalTests}
                                                </td>

                                                <td className="px-4 py-4">
                                                    {formatDate(patient.createdAt)}
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <Badge
                                                        variant={
                                                            patient.status === 'ACTIVE'
                                                                ? 'success'
                                                                : 'danger'
                                                        }
                                                        size="sm"
                                                    >
                                                        {patient.status}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-4 text-right">
                                                    <Link
                                                        href={`/patients/${patient._id}`}
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

                    {data.pagination.totalPages > 1 && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Page {data.pagination.page} of {data.pagination.totalPages}
                            </p>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page <= 1}
                                >
                                    Previous
                                </Button>

                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= data.pagination.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}