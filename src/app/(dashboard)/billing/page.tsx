'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

type BillStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

interface Patient {
    _id: string;
    patientId: string;
    name: string;
    mobile?: string;
}

interface Doctor {
    _id: string;
    doctorId: string;
    name: string;
    specialization?: string;
}

interface Bill {
    _id: string;
    billNumber: string;
    patient: Patient;
    doctor?: Doctor | null;
    items: {
        testName: string;
        testCode: string;
        quantity: number;
        unitPrice: number;
        discountAmount: number;
        totalAmount: number;
    }[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    billStatus: BillStatus;
    billDate: string;
    notes?: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(value: string) {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatPaymentStatus(status: PaymentStatus) {
    switch (status) {
        case 'UNPAID':
            return 'Unpaid';

        case 'PARTIAL':
            return 'Partial';

        case 'PAID':
            return 'Paid';

        case 'REFUNDED':
            return 'Refunded';

        default:
            return status;
    }
}

function formatBillStatus(status: BillStatus) {
    switch (status) {
        case 'DRAFT':
            return 'Draft';

        case 'CONFIRMED':
            return 'Confirmed';

        case 'CANCELLED':
            return 'Cancelled';

        default:
            return status;
    }
}

function getPaymentStatusClass(status: PaymentStatus) {
    switch (status) {
        case 'PAID':
            return 'bg-green-100 text-green-700';

        case 'PARTIAL':
            return 'bg-amber-100 text-amber-700';

        case 'UNPAID':
            return 'bg-red-100 text-red-700';

        case 'REFUNDED':
            return 'bg-blue-100 text-blue-700';

        default:
            return 'bg-slate-100 text-slate-700';
    }
}

function getBillStatusClass(status: BillStatus) {
    switch (status) {
        case 'CONFIRMED':
            return 'bg-green-100 text-green-700';

        case 'DRAFT':
            return 'bg-slate-100 text-slate-700';

        case 'CANCELLED':
            return 'bg-red-100 text-red-700';

        default:
            return 'bg-slate-100 text-slate-700';
    }
}

export default function BillingPage() {
    const [bills, setBills] = useState<Bill[]>([]);

    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const [search, setSearch] = useState('');

    const [paymentStatus, setPaymentStatus] = useState('');

    const [billStatus, setBillStatus] = useState('');

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const loadBills = async (page = 1) => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams();

            params.set('page', String(page));

            params.set('limit', '20');

            if (search.trim()) {
                params.set('search', search.trim());
            }

            if (paymentStatus) {
                params.set('paymentStatus', paymentStatus);
            }

            if (billStatus) {
                params.set('billStatus', billStatus);
            }

            const response = await fetch(`/api/bills?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const data = await response.json();

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                setError(data.message || 'Failed to load bills.');
                return;
            }

            setBills(data.bills || []);

            setPagination(
                data.pagination || {
                    page,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            );
        } catch {
            setError('Unable to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBills(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        loadBills(1);
    };

    const handleClearFilters = () => {
        setSearch('');
        setPaymentStatus('');
        setBillStatus('');

        setTimeout(() => {
            loadBills(1);
        }, 0);
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Billing</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Manage patient bills, payments and outstanding dues.
                    </p>
                </div>

                <Link href="/billing/new">
                    <Button className="w-full sm:w-auto">+ Create Bill</Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <label
                            htmlFor="search"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Search
                        </label>

                        <input
                            id="search"
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                            placeholder="Search by bill number, test name or test code..."
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="paymentStatus"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Payment Status
                        </label>

                        <Select
                            id="paymentStatus"
                            value={paymentStatus}
                            onChange={(event) => {
                                setPaymentStatus(event.target.value);
                            }}
                        >
                            <option value="">All Payment Status</option>

                            <option value="UNPAID">Unpaid</option>

                            <option value="PARTIAL">Partial</option>

                            <option value="PAID">Paid</option>

                            <option value="REFUNDED">Refunded</option>
                        </Select>
                    </div>

                    <div>
                        <label
                            htmlFor="billStatus"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Bill Status
                        </label>

                        <Select
                            id="billStatus"
                            value={billStatus}
                            onChange={(event) => {
                                setBillStatus(event.target.value);
                            }}
                        >
                            <option value="">All Bill Status</option>

                            <option value="DRAFT">Draft</option>

                            <option value="CONFIRMED">Confirmed</option>

                            <option value="CANCELLED">Cancelled</option>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row md:col-span-4 md:justify-end">
                        <Button
                            type="button"
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            Search
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClearFilters}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Error */}
            {error && (
                <div className="mb-6">
                    <Alert variant="danger">
                        <p className="text-sm">{error}</p>
                    </Alert>
                </div>
            )}

            {/* Table */}
            <Card>
                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <Spinner />
                    </div>
                ) : bills.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                        <h3 className="text-lg font-semibold text-[var(--color-text)]">
                            No bills found
                        </h3>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Create a bill or change your search filters.
                        </p>

                        <Link href="/billing/new" className="mt-4">
                            <Button>Create Bill</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)] bg-slate-50">
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Bill
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Patient
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Tests
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Total
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Paid
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Due
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Payment
                                        </th>

                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Status
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {bills.map((bill) => (
                                        <tr
                                            key={bill._id}
                                            className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-[var(--color-text)]">
                                                    {bill.billNumber}
                                                </div>

                                                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                    {formatDate(bill.billDate)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-medium text-[var(--color-text)]">
                                                    {bill.patient?.name}
                                                </div>

                                                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                    {bill.patient?.patientId}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="max-w-[230px]">
                                                    <div className="font-medium text-[var(--color-text)]">
                                                        {bill.items?.length} test
                                                        {bill.items?.length !== 1 ? 's' : ''}
                                                    </div>

                                                    <div className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                                                        {bill.items
                                                            ?.map((item) => item.testName)
                                                            .join(', ')}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right font-medium text-[var(--color-text)]">
                                                {formatCurrency(bill.grandTotal)}
                                            </td>

                                            <td className="px-6 py-4 text-right text-sm text-green-700">
                                                {formatCurrency(bill.paidAmount)}
                                            </td>

                                            <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                                                {formatCurrency(bill.dueAmount)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusClass(
                                                        bill.paymentStatus,
                                                    )}`}
                                                >
                                                    {formatPaymentStatus(bill.paymentStatus)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getBillStatusClass(
                                                        bill.billStatus,
                                                    )}`}
                                                >
                                                    {formatBillStatus(bill.billStatus)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/billing/${bill._id}`}
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
                            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Page {pagination.page} of {pagination.totalPages} ·{' '}
                                    {pagination.total} bills
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={!pagination.hasPreviousPage || loading}
                                        onClick={() => loadBills(pagination.page - 1)}
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={!pagination.hasNextPage || loading}
                                        onClick={() => loadBills(pagination.page + 1)}
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
