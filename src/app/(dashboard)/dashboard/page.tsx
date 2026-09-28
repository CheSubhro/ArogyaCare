'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface DashboardSummary {
    totalPatients: number;
    todaysBills: number;
    todaysRevenue: number;
    todaysCollected: number;
    todaysDue: number;
}

interface RecentBill {
    id: string;
    billNumber: string;
    patient: {
        id: string;
        name: string;
        patientId: string;
        mobile?: string;
    } | null;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: string;
    billStatus: string;
    billDate: string;
}

interface Activity {
    id: string;
    type: string;
    title: string;
    description: string;
    patientName: string;
    testName: string;
    status: string;
    formattedDate: string;
}

interface DashboardData {
    summary: DashboardSummary;
    recentBills: RecentBill[];
    activities: Activity[];
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}

function getPaymentBadgeVariant(status: string) {
    switch (status) {
        case 'PAID':
            return 'success';

        case 'PARTIAL':
            return 'warning';

        case 'REFUNDED':
            return 'danger';

        default:
            return 'default';
    }
}

function getSampleStatusVariant(status: string) {
    switch (status) {
        case 'PROCESSED':
            return 'success';

        case 'RECEIVED':
            return 'info';

        case 'COLLECTED':
            return 'primary';

        case 'REJECTED':
            return 'danger';

        case 'CANCELLED':
            return 'warning';

        default:
            return 'default';
    }
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            try {
                setLoading(true);
                setError('');

                const response = await fetch('/api/dashboard', {
                    method: 'GET',
                    cache: 'no-store',
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    if (response.status === 401) {
                        window.location.href = '/login';
                        return;
                    }

                    throw new Error(result.message || 'Failed to load dashboard');
                }

                if (!cancelled) {
                    setData({
                        summary: result.summary,
                        recentBills: result.recentBills || [],
                        activities: result.activities || [],
                    });
                }
            } catch (error) {
                console.error('Dashboard loading error:', error);

                if (!cancelled) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'Something went wrong while loading dashboard',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Overview of your diagnostic center.
                    </p>
                </div>

                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { summary, recentBills, activities } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Here's what's happening at ArogyaCare Diagnostics today.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <p className="text-sm font-medium text-[var(--color-text-muted)]">
                        Total Patients
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">
                        {summary.totalPatients}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">Active patients</p>
                </Card>

                <Card>
                    <p className="text-sm font-medium text-[var(--color-text-muted)]">
                        Today's Bills
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">
                        {summary.todaysBills}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        Bills created today
                    </p>
                </Card>

                <Card>
                    <p className="text-sm font-medium text-[var(--color-text-muted)]">
                        Today's Collection
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[var(--color-success)]">
                        {formatCurrency(summary.todaysCollected)}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        Amount collected today
                    </p>
                </Card>

                <Card>
                    <p className="text-sm font-medium text-[var(--color-text-muted)]">
                        Today's Due
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[var(--color-warning)]">
                        {formatCurrency(summary.todaysDue)}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        Outstanding from today's bills
                    </p>
                </Card>
            </div>

            {/* Quick Actions + Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Quick Actions
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Frequently used actions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Link href="/patients/new">
                            <Button variant="primary" className="w-full">
                                + New Patient
                            </Button>
                        </Link>

                        <Link href="/billing/new">
                            <Button variant="primary" className="w-full">
                                + New Bill
                            </Button>
                        </Link>

                        <Link href="/lab-samples/new">
                            <Button className="w-full">+ Collect Sample</Button>
                        </Link>

                        <Link href="/doctors/new">
                            <Button className="w-full">+ Add Doctor</Button>
                        </Link>
                    </div>
                </Card>

                {/* Today's Activity */}
                <Card>
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Recent Activity
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Recent lab sample activity.
                        </p>
                    </div>

                    {activities.length === 0 ? (
                        <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                            No recent activity found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4 last:border-b-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium text-[var(--color-text)]">
                                            {activity.title}
                                        </p>

                                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                            {activity.patientName} · {activity.testName}
                                        </p>

                                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                            {activity.description}
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <Badge variant={getSampleStatusVariant(activity.status)}>
                                            {activity.status}
                                        </Badge>

                                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                                            {activity.formattedDate}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Financial Overview */}
            <Card>
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Today's Financial Overview
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Summary of today's billing.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-[var(--color-border)] p-4">
                        <p className="text-sm text-[var(--color-text-muted)]">Grand Total</p>

                        <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                            {formatCurrency(summary.todaysRevenue)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-[var(--color-border)] p-4">
                        <p className="text-sm text-[var(--color-text-muted)]">Collected</p>

                        <p className="mt-1 text-xl font-semibold text-[var(--color-success)]">
                            {formatCurrency(summary.todaysCollected)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-[var(--color-border)] p-4">
                        <p className="text-sm text-[var(--color-text-muted)]">Due</p>

                        <p className="mt-1 text-xl font-semibold text-[var(--color-warning)]">
                            {formatCurrency(summary.todaysDue)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Recent Bills */}
            <Card>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Recent Bills
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Latest billing transactions.
                        </p>
                    </div>

                    <Link href="/billing">
                        <Button>View All Bills</Button>
                    </Link>
                </div>

                {recentBills.length === 0 ? (
                    <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">
                        No bills found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="px-3 py-3 font-semibold text-[var(--color-text)]">
                                        Bill No.
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-[var(--color-text)]">
                                        Patient
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-[var(--color-text)]">
                                        Amount
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-[var(--color-text)]">
                                        Paid
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-[var(--color-text)]">
                                        Due
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-[var(--color-text)]">
                                        Status
                                    </th>

                                    <th className="px-3 py-3 font-semibold text-[var(--color-text)]">
                                        Date
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentBills.map((bill) => (
                                    <tr
                                        key={bill.id}
                                        className="border-b border-[var(--color-border)] last:border-b-0"
                                    >
                                        <td className="px-3 py-3">
                                            <Link
                                                href={`/billing/${bill.id}`}
                                                className="font-medium text-[var(--color-primary)] hover:underline"
                                            >
                                                {bill.billNumber}
                                            </Link>
                                        </td>

                                        <td className="px-3 py-3">
                                            <div>
                                                <p className="font-medium text-[var(--color-text)]">
                                                    {bill.patient?.name || 'Unknown'}
                                                </p>

                                                {bill.patient?.patientId && (
                                                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                                        {bill.patient.patientId}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-3 py-3 font-medium">
                                            {formatCurrency(bill.grandTotal)}
                                        </td>

                                        <td className="px-3 py-3">
                                            {formatCurrency(bill.paidAmount)}
                                        </td>

                                        <td className="px-3 py-3">
                                            {formatCurrency(bill.dueAmount)}
                                        </td>

                                        <td className="px-3 py-3">
                                            <Badge
                                                variant={getPaymentBadgeVariant(bill.paymentStatus)}
                                            >
                                                {bill.paymentStatus}
                                            </Badge>
                                        </td>

                                        <td className="px-3 py-3 text-[var(--color-text-muted)]">
                                            {formatDate(bill.billDate)}
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
