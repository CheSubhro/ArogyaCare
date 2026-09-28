'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface PaymentMethodReport {
    method: string;
    amount: number;
    transactionCount: number;
}

interface ReportsData {
    dateRange: {
        from: string;
        to: string;
    };
    overview: {
        totalPatients: number;
        newPatients: number;
        totalBills: number;
        confirmedBills: number;
        cancelledBills: number;
        grossAmount: number;
        discountAmount: number;
        taxAmount: number;
        grandTotal: number;
        paidAmount: number;
        dueAmount: number;
    };
    paymentMethods: PaymentMethodReport[];
    samples: {
        pending: number;
        collected: number;
        received: number;
        processed: number;
        rejected: number;
        cancelled: number;
    };
}

type DatePreset = 'THIS_MONTH' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_MONTH' | 'CUSTOM';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(value);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('en-IN').format(value);
}

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

    if (preset === 'YESTERDAY') {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const date = getDateString(yesterday);

        return {
            from: date,
            to: date,
        };
    }

    if (preset === 'THIS_WEEK') {
        const day = today.getDay();
        const diff = day === 0 ? 6 : day - 1;

        const monday = new Date(today);
        monday.setDate(today.getDate() - diff);

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

    return {
        from: getDateString(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: getDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    };
}

function formatPaymentMethod(method: string) {
    const labels: Record<string, string> = {
        CASH: 'Cash',
        UPI: 'UPI',
        CARD: 'Card',
        BANK_TRANSFER: 'Bank Transfer',
        OTHER: 'Other',
    };

    return labels[method] || method;
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null);

    const [preset, setPreset] = useState<DatePreset>('THIS_MONTH');

    const initialRange = useMemo(() => getDateRange('THIS_MONTH'), []);

    const [fromDate, setFromDate] = useState(initialRange.from);

    const [toDate, setToDate] = useState(initialRange.to);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const loadReports = async (from = fromDate, to = toDate) => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams({
                from,
                to,
            });

            const response = await fetch(`/api/reports/overview?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to load reports.');
            }

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();

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

        loadReports(range.from, range.to);
    };

    const handleCustomApply = () => {
        if (!fromDate || !toDate) {
            setError('Please select both dates.');
            return;
        }

        if (fromDate > toDate) {
            setError('From date cannot be after To date.');
            return;
        }

        loadReports(fromDate, toDate);
    };

    if (loading && !data) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Reports</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        View diagnostic center performance, billing and operational summaries.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link href="/reports/billing">
                        <Button type="button" variant="primary">
                            Billing Reports
                        </Button>
                    </Link>

                    <Link href="/reports/patients">
                        <Button type="button">Patient Reports</Button>
                    </Link>
                </div>
            </div>

            {error && (
                <Alert variant="danger">
                    <p className="text-sm">{error}</p>
                </Alert>
            )}

            {/* Report Period */}
            <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Report Period
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Select the period for the summary.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="min-w-[180px]">
                            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                Period
                            </label>

                            <Select
                                value={preset}
                                onChange={(event) =>
                                    handlePresetChange(event.target.value as DatePreset)
                                }
                            >
                                <option value="TODAY">Today</option>

                                <option value="YESTERDAY">Yesterday</option>

                                <option value="THIS_WEEK">This Week</option>

                                <option value="THIS_MONTH">This Month</option>

                                <option value="LAST_MONTH">Last Month</option>

                                <option value="CUSTOM">Custom Range</option>
                            </Select>
                        </div>

                        {preset === 'CUSTOM' && (
                            <>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                        From
                                    </label>

                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(event) => setFromDate(event.target.value)}
                                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                        To
                                    </label>

                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(event) => setToDate(event.target.value)}
                                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCustomApply}
                                    className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
                                >
                                    Apply
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {data && (
                <>
                    {/* Date Range */}
                    <div>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Showing reports from{' '}
                            <strong>
                                {new Date(data.dateRange.from).toLocaleDateString('en-IN')}
                            </strong>{' '}
                            to{' '}
                            <strong>
                                {new Date(data.dateRange.to).toLocaleDateString('en-IN')}
                            </strong>
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Total Patients</p>

                            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                                {formatNumber(data.overview.totalPatients)}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                {formatNumber(data.overview.newPatients)} new in period
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Total Bills</p>

                            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                                {formatNumber(data.overview.totalBills)}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                {formatNumber(data.overview.confirmedBills)} confirmed
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Total Revenue</p>

                            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                                {formatCurrency(data.overview.grandTotal)}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                After discounts
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Collected</p>

                            <p className="mt-2 text-2xl font-bold text-green-700">
                                {formatCurrency(data.overview.paidAmount)}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                Current collection
                            </p>
                        </Card>
                    </div>

                    {/* Billing Summary + Payment Collection */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                    Billing Summary
                                </h2>

                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                    Financial overview for the selected period.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-text-muted)]">
                                        Gross Amount
                                    </span>

                                    <span className="font-medium">
                                        {formatCurrency(data.overview.grossAmount)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-text-muted)]">
                                        Discount
                                    </span>

                                    <span className="font-medium text-amber-700">
                                        -{formatCurrency(data.overview.discountAmount)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-text-muted)]">
                                        Tax
                                    </span>

                                    <span className="font-medium">
                                        {formatCurrency(data.overview.taxAmount)}
                                    </span>
                                </div>

                                <div className="border-t border-[var(--color-border)] pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">Grand Total</span>

                                        <span className="text-lg font-bold">
                                            {formatCurrency(data.overview.grandTotal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-text-muted)]">
                                        Collected
                                    </span>

                                    <span className="font-semibold text-green-700">
                                        {formatCurrency(data.overview.paidAmount)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-text-muted)]">
                                        Due
                                    </span>

                                    <span className="font-semibold text-red-700">
                                        {formatCurrency(data.overview.dueAmount)}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                    Payment Collection
                                </h2>

                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                    Collection by payment method.
                                </p>
                            </div>

                            {data.paymentMethods.length === 0 ? (
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    No payment transactions found for this period.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {data.paymentMethods.map((item) => (
                                        <div
                                            key={item.method}
                                            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {formatPaymentMethod(item.method)}
                                                </p>

                                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                    {item.transactionCount} transaction
                                                    {item.transactionCount !== 1 ? 's' : ''}
                                                </p>
                                            </div>

                                            <p className="font-semibold">
                                                {formatCurrency(item.amount)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Bill Status + Lab Operations */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                    Bill Status
                                </h2>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg bg-slate-50 p-4 text-center">
                                    <p className="text-2xl font-bold">
                                        {formatNumber(data.overview.totalBills)}
                                    </p>

                                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                        Total
                                    </p>
                                </div>

                                <div className="rounded-lg bg-green-50 p-4 text-center">
                                    <p className="text-2xl font-bold text-green-700">
                                        {formatNumber(data.overview.confirmedBills)}
                                    </p>

                                    <p className="mt-1 text-xs text-green-700">Confirmed</p>
                                </div>

                                <div className="rounded-lg bg-red-50 p-4 text-center">
                                    <p className="text-2xl font-bold text-red-700">
                                        {formatNumber(data.overview.cancelledBills)}
                                    </p>

                                    <p className="mt-1 text-xs text-red-700">Cancelled</p>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                    Lab Operations
                                </h2>

                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                    Sample processing summary.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div className="rounded-lg bg-amber-50 p-3">
                                    <p className="text-xl font-bold text-amber-700">
                                        {data.samples.pending}
                                    </p>

                                    <p className="text-xs text-amber-700">Pending</p>
                                </div>

                                <div className="rounded-lg bg-blue-50 p-3">
                                    <p className="text-xl font-bold text-blue-700">
                                        {data.samples.collected}
                                    </p>

                                    <p className="text-xs text-blue-700">Collected</p>
                                </div>

                                <div className="rounded-lg bg-indigo-50 p-3">
                                    <p className="text-xl font-bold text-indigo-700">
                                        {data.samples.received}
                                    </p>

                                    <p className="text-xs text-indigo-700">Received</p>
                                </div>

                                <div className="rounded-lg bg-green-50 p-3">
                                    <p className="text-xl font-bold text-green-700">
                                        {data.samples.processed}
                                    </p>

                                    <p className="text-xs text-green-700">Processed</p>
                                </div>

                                <div className="rounded-lg bg-red-50 p-3">
                                    <p className="text-xl font-bold text-red-700">
                                        {data.samples.rejected}
                                    </p>

                                    <p className="text-xs text-red-700">Rejected</p>
                                </div>

                                <div className="rounded-lg bg-slate-100 p-3">
                                    <p className="text-xl font-bold text-slate-700">
                                        {data.samples.cancelled}
                                    </p>

                                    <p className="text-xs text-slate-700">Cancelled</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Report Summary */}
                    <Card>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                    Report Summary
                                </h2>

                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                    Current period overview.
                                </p>
                            </div>

                            <Badge variant="primary" size="sm">
                                {preset === 'CUSTOM' ? 'Custom Range' : preset.replace('_', ' ')}
                            </Badge>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}