'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface Patient {
    patientId: string;
    name: string;
    gender?: string;
    dateOfBirth?: string;
    age?: number;
    mobile?: string;
    email?: string;
    address?: string;
    city?: string;
    bloodGroup?: string;
}

interface Doctor {
    doctorId: string;
    name: string;
    qualification?: string;
    specialization?: string;
    registrationNumber?: string;
    mobileNumber?: string;
    email?: string;
    clinicName?: string;
    hospitalName?: string;
    city?: string;
    referralType?: string;
}

interface BillTest {
    _id: string;
    name: string;
    code: string;
    department?: string;
    testType?: string;
    sampleType?: string;
    specimenSite?: string;
    modality?: string;
}

interface BillItem {
    test: BillTest | string;
    testName: string;
    testCode: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    totalAmount: number;
}

interface Bill {
    _id: string;
    billNumber: string;
    patient: Patient;
    doctor?: Doctor | null;
    items: BillItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    paidAmount: number;
    dueAmount: number;
    paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
    billStatus: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    billDate: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

function formatCurrency(amount: number) {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDateTime(value?: string) {
    if (!value) return '-';

    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getPaymentStatusVariant(status: Bill['paymentStatus']) {
    switch (status) {
        case 'PAID':
            return 'success';

        case 'PARTIAL':
            return 'warning';

        case 'REFUNDED':
            return 'info';

        default:
            return 'danger';
    }
}

function getBillStatusVariant(status: Bill['billStatus']) {
    switch (status) {
        case 'CONFIRMED':
            return 'success';

        case 'DRAFT':
            return 'warning';

        default:
            return 'danger';
    }
}

export default function BillDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const id = params.id as string;

    const [bill, setBill] = useState<Bill | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    useEffect(() => {
        const loadBill = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`/api/bills/${id}`, {
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
                    setError(data.message || 'Failed to load bill.');
                    return;
                }

                setBill(data.bill);
            } catch {
                setError('Unable to connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadBill();
        }
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Link
                    href="/billing"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Billing
                </Link>

                <div className="mt-6">
                    <Alert variant="danger">
                        <p className="text-sm">{error}</p>
                    </Alert>
                </div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div>
                <Link
                    href="/billing"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Billing
                </Link>

                <div className="mt-6">
                    <Alert variant="danger">
                        <p className="text-sm">Bill not found.</p>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/billing"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Billing
                </Link>

                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">
                            Bill {bill.billNumber}
                        </h1>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Created on {formatDateTime(bill.createdAt)}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant={getBillStatusVariant(bill.billStatus)}>
                            {bill.billStatus}
                        </Badge>

                        <Badge variant={getPaymentStatusVariant(bill.paymentStatus)}>
                            {bill.paymentStatus}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Bill Information */}
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Bill Information
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Bill Number
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                            {bill.billNumber}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Bill Date
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDateTime(bill.billDate)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Payment Method
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {bill.paymentMethod || '-'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Bill Status
                        </p>

                        <div className="mt-1">
                            <Badge variant={getBillStatusVariant(bill.billStatus)}>
                                {bill.billStatus}
                            </Badge>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Patient & Doctor */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Patient Information
                        </h2>
                    </div>

                    <div className="space-y-4 p-6">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Patient
                            </p>

                            <Link
                                href={`/patients/${
                                    (
                                        bill.patient as unknown as {
                                            _id: string;
                                        }
                                    )._id
                                }`}
                                className="mt-1 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline"
                            >
                                {bill.patient.name}
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Patient ID</p>

                                <p className="mt-1 text-sm font-medium">{bill.patient.patientId}</p>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Mobile</p>

                                <p className="mt-1 text-sm">{bill.patient.mobile || '-'}</p>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Gender</p>

                                <p className="mt-1 text-sm">{bill.patient.gender || '-'}</p>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Age</p>

                                <p className="mt-1 text-sm">{bill.patient.age ?? '-'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Address</p>

                            <p className="mt-1 text-sm">
                                {[bill.patient.address, bill.patient.city]
                                    .filter(Boolean)
                                    .join(', ') || '-'}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Referring Doctor
                        </h2>
                    </div>

                    <div className="p-6">
                        {bill.doctor ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Doctor
                                    </p>

                                    <Link
                                        href={`/doctors/${
                                            (
                                                bill.doctor as unknown as {
                                                    _id: string;
                                                }
                                            )._id
                                        }`}
                                        className="mt-1 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline"
                                    >
                                        {bill.doctor.name}
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            Doctor ID
                                        </p>

                                        <p className="mt-1 text-sm">{bill.doctor.doctorId}</p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            Qualification
                                        </p>

                                        <p className="mt-1 text-sm">
                                            {bill.doctor.qualification || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            Specialization
                                        </p>

                                        <p className="mt-1 text-sm">
                                            {bill.doctor.specialization || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            Mobile
                                        </p>

                                        <p className="mt-1 text-sm">
                                            {bill.doctor.mobileNumber || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">
                                No referring doctor specified.
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Tests */}
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Tests</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] bg-slate-50">
                                <th className="px-6 py-3 text-left font-semibold text-[var(--color-text)]">
                                    #
                                </th>

                                <th className="px-6 py-3 text-left font-semibold text-[var(--color-text)]">
                                    Test
                                </th>

                                <th className="px-6 py-3 text-left font-semibold text-[var(--color-text)]">
                                    Code
                                </th>

                                <th className="px-6 py-3 text-right font-semibold text-[var(--color-text)]">
                                    Qty
                                </th>

                                <th className="px-6 py-3 text-right font-semibold text-[var(--color-text)]">
                                    Unit Price
                                </th>

                                <th className="px-6 py-3 text-right font-semibold text-[var(--color-text)]">
                                    Discount
                                </th>

                                <th className="px-6 py-3 text-right font-semibold text-[var(--color-text)]">
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {bill.items.map((item, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-[var(--color-border)] last:border-b-0"
                                >
                                    <td className="px-6 py-4 text-[var(--color-text-muted)]">
                                        {index + 1}
                                    </td>

                                    <td className="px-6 py-4">
                                        <p className="font-medium text-[var(--color-text)]">
                                            {item.testName}
                                        </p>

                                        {typeof item.test !== 'string' && item.test?.department && (
                                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                {item.test.department}
                                            </p>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-[var(--color-text-muted)]">
                                        {item.testCode}
                                    </td>

                                    <td className="px-6 py-4 text-right">{item.quantity}</td>

                                    <td className="px-6 py-4 text-right">
                                        {formatCurrency(item.unitPrice)}
                                    </td>

                                    <td className="px-6 py-4 text-right text-red-600">
                                        {item.discountAmount > 0
                                            ? `-${formatCurrency(item.discountAmount)}`
                                            : '-'}
                                    </td>

                                    <td className="px-6 py-4 text-right font-semibold text-[var(--color-text)]">
                                        {formatCurrency(item.totalAmount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Financial Summary */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Payment Information
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text-muted)]">
                                    Payment Status
                                </span>

                                <Badge variant={getPaymentStatusVariant(bill.paymentStatus)}>
                                    {bill.paymentStatus}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text-muted)]">
                                    Payment Method
                                </span>

                                <span className="text-sm font-medium text-[var(--color-text)]">
                                    {bill.paymentMethod || '-'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text-muted)]">
                                    Paid Amount
                                </span>

                                <span className="text-sm font-semibold text-green-700">
                                    {formatCurrency(bill.paidAmount)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text-muted)]">
                                    Due Amount
                                </span>

                                <span className="text-sm font-semibold text-red-600">
                                    {formatCurrency(bill.dueAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Bill Summary
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Subtotal</span>

                                <span>{formatCurrency(bill.subtotal)}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Discount</span>

                                <span className="text-red-600">
                                    -{formatCurrency(bill.discountAmount)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Tax</span>

                                <span>{formatCurrency(bill.taxAmount)}</span>
                            </div>

                            <div className="border-t border-[var(--color-border)] pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Grand Total</span>

                                    <span className="text-xl font-bold text-[var(--color-primary)]">
                                        {formatCurrency(bill.grandTotal)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Paid</span>

                                <span className="font-semibold text-green-700">
                                    {formatCurrency(bill.paidAmount)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Due</span>

                                <span className="font-semibold text-red-600">
                                    {formatCurrency(bill.dueAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Notes */}
            {bill.notes && (
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">Notes</h2>
                    </div>

                    <div className="p-6">
                        <p className="whitespace-pre-wrap text-sm text-[var(--color-text)]">
                            {bill.notes}
                        </p>
                    </div>
                </Card>
            )}

            {/* Record Information */}
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Record Information
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Created At
                        </p>

                        <p className="mt-1 text-sm">{formatDateTime(bill.createdAt)}</p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Last Updated
                        </p>

                        <p className="mt-1 text-sm">{formatDateTime(bill.updatedAt)}</p>
                    </div>
                </div>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link href="/billing">
                    <Button variant="secondary" className="w-full sm:w-auto">
                        Back to Billing
                    </Button>
                </Link>
            </div>
        </div>
    );
}
