'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface Patient {
    _id: string;
    patientId: string;
    name: string;
    gender?: string;
    age?: number;
    mobile?: string;
    email?: string;
    address?: string;
    city?: string;
    bloodGroup?: string;
}

interface Doctor {
    _id: string;
    doctorId: string;
    name: string;
    qualification?: string;
    specialization?: string;
    registrationNumber?: string;
    mobileNumber?: string;
    clinicName?: string;
    hospitalName?: string;
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

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

interface BillPayment {
    _id: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    referenceNumber?: string;
    receivedBy?: {
        _id: string;
        name: string;
        email: string;
    } | null;
    notes?: string;
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
    paymentMethod?: PaymentMethod;
    payments: BillPayment[];
    billStatus: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    billDate: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

function formatCurrency(amount: number) {
    return `₹${amount.toFixed(2)}`;
}

function formatDate(dateString: string) {
    if (!dateString) {
        return '-';
    }

    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateTime(dateString: string) {
    if (!dateString) {
        return '-';
    }

    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatPaymentMethod(method?: PaymentMethod) {
    switch (method) {
        case 'CASH':
            return 'Cash';
        case 'UPI':
            return 'UPI';
        case 'CARD':
            return 'Card';
        case 'BANK_TRANSFER':
            return 'Bank Transfer';
        case 'OTHER':
            return 'Other';
        default:
            return '-';
    }
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

export default function BillReceiptPage() {
    const params = useParams();
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

                if (!response.ok) {
                    setError(data.message || 'Failed to fetch bill.');
                    return;
                }

                setBill(data.bill);
            } catch {
                setError('Something went wrong while loading the bill.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadBill();
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Link
                    href={`/billing/${id}`}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Bill
                </Link>

                <Alert variant="danger">
                    <p className="text-sm">{error}</p>
                </Alert>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="space-y-4">
                <Link
                    href={`/billing/${id}`}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Bill
                </Link>

                <Alert variant="danger">
                    <p className="text-sm">Bill not found.</p>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Action Bar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <div>
                    <Link
                        href={`/billing/${bill._id}`}
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Bill
                    </Link>

                    <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                        Bill Receipt
                    </h1>
                </div>

                <Button type="button" variant="primary" onClick={handlePrint}>
                    Print Receipt
                </Button>
            </div>

            {/* Receipt */}
            <div className="mx-auto max-w-[900px] bg-white shadow-sm print:max-w-none print:shadow-none">
                {/* Header */}
                <div className="border-b-2 border-[var(--color-primary)] px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-wide text-[var(--color-primary)]">
                                AROGYACARE DIAGNOSTICS
                            </h2>

                            <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                Diagnostic &amp; Healthcare Services
                            </p>

                            <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                                Pathology • Radiology • Cardiology • Neurology • Diagnostic
                                Procedures
                            </p>
                        </div>

                        <div className="text-left sm:text-right">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                BILL / RECEIPT
                            </p>

                            <p className="mt-1 text-xl font-bold text-[var(--color-text)]">
                                {bill.billNumber}
                            </p>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Date: {formatDate(bill.billDate)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-6 py-4 sm:px-8">
                    <Badge variant={getBillStatusVariant(bill.billStatus)}>{bill.billStatus}</Badge>

                    <Badge variant={getPaymentStatusVariant(bill.paymentStatus)}>
                        {bill.paymentStatus}
                    </Badge>
                </div>

                {/* Patient & Doctor */}
                <div className="grid grid-cols-1 gap-6 border-b border-[var(--color-border)] px-6 py-6 sm:px-8 md:grid-cols-2">
                    {/* Patient */}
                    <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                            Patient Information
                        </h3>

                        <div className="space-y-1.5 text-sm">
                            <div className="flex gap-2">
                                <span className="w-28 text-[var(--color-text-muted)]">
                                    Patient ID
                                </span>
                                <span className="font-medium text-[var(--color-text)]">
                                    {bill.patient.patientId}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <span className="w-28 text-[var(--color-text-muted)]">Name</span>
                                <span className="font-medium text-[var(--color-text)]">
                                    {bill.patient.name}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <span className="w-28 text-[var(--color-text-muted)]">Gender</span>
                                <span className="text-[var(--color-text)]">
                                    {bill.patient.gender || '-'}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <span className="w-28 text-[var(--color-text-muted)]">Age</span>
                                <span className="text-[var(--color-text)]">
                                    {bill.patient.age ?? '-'}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <span className="w-28 text-[var(--color-text-muted)]">Mobile</span>
                                <span className="text-[var(--color-text)]">
                                    {bill.patient.mobile || '-'}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <span className="w-28 text-[var(--color-text-muted)]">Address</span>
                                <span className="text-[var(--color-text)]">
                                    {[bill.patient.address, bill.patient.city]
                                        .filter(Boolean)
                                        .join(', ') || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Doctor */}
                    <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                            Referring Doctor
                        </h3>

                        {bill.doctor ? (
                            <div className="space-y-1.5 text-sm">
                                <div className="flex gap-2">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Doctor ID
                                    </span>
                                    <span className="font-medium text-[var(--color-text)]">
                                        {bill.doctor.doctorId}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Name
                                    </span>
                                    <span className="font-medium text-[var(--color-text)]">
                                        {bill.doctor.name}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Qualification
                                    </span>
                                    <span className="text-[var(--color-text)]">
                                        {bill.doctor.qualification || '-'}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Specialization
                                    </span>
                                    <span className="text-[var(--color-text)]">
                                        {bill.doctor.specialization || '-'}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Registration
                                    </span>
                                    <span className="text-[var(--color-text)]">
                                        {bill.doctor.registrationNumber || '-'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">
                                No referring doctor associated.
                            </p>
                        )}
                    </div>
                </div>

                {/* Diagnostic Services */}
                <div className="px-6 py-6 sm:px-8">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                        Diagnostic Services
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead>
                                <tr className="border-y border-[var(--color-border)] bg-slate-50">
                                    <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                        #
                                    </th>

                                    <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                        Test / Service
                                    </th>

                                    <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                        Code
                                    </th>

                                    <th className="px-3 py-3 text-center font-semibold text-[var(--color-text-muted)]">
                                        Qty
                                    </th>

                                    <th className="px-3 py-3 text-right font-semibold text-[var(--color-text-muted)]">
                                        Unit Price
                                    </th>

                                    <th className="px-3 py-3 text-right font-semibold text-[var(--color-text-muted)]">
                                        Discount
                                    </th>

                                    <th className="px-3 py-3 text-right font-semibold text-[var(--color-text-muted)]">
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {bill.items.map((item, index) => (
                                    <tr
                                        key={`${item.testCode}-${index}`}
                                        className="border-b border-[var(--color-border)]"
                                    >
                                        <td className="px-3 py-3 text-[var(--color-text-muted)]">
                                            {index + 1}
                                        </td>

                                        <td className="px-3 py-3">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {item.testName}
                                            </p>

                                            {typeof item.test !== 'string' && item.test && (
                                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                    {item.test.department ||
                                                        item.test.testType ||
                                                        '-'}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-3 py-3 font-medium text-[var(--color-text)]">
                                            {item.testCode}
                                        </td>

                                        <td className="px-3 py-3 text-center text-[var(--color-text)]">
                                            {item.quantity}
                                        </td>

                                        <td className="px-3 py-3 text-right text-[var(--color-text)]">
                                            {formatCurrency(item.unitPrice)}
                                        </td>

                                        <td className="px-3 py-3 text-right text-[var(--color-text)]">
                                            {formatCurrency(item.discountAmount)}
                                        </td>

                                        <td className="px-3 py-3 text-right font-semibold text-[var(--color-text)]">
                                            {formatCurrency(item.totalAmount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-[var(--color-border)] px-6 py-6 sm:px-8">
                    <div className="ml-auto max-w-md space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">Subtotal</span>

                            <span className="text-sm font-medium text-[var(--color-text)]">
                                {formatCurrency(bill.subtotal)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">Discount</span>

                            <span className="text-sm font-medium text-[var(--color-danger)]">
                                -{formatCurrency(bill.discountAmount)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">Tax</span>

                            <span className="text-sm font-medium text-[var(--color-text)]">
                                {formatCurrency(bill.taxAmount)}
                            </span>
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-base font-semibold text-[var(--color-text)]">
                                    Grand Total
                                </span>

                                <span className="text-xl font-bold text-[var(--color-primary)]">
                                    {formatCurrency(bill.grandTotal)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-muted)]">Paid</span>

                            <span className="text-sm font-semibold text-[var(--color-success)]">
                                {formatCurrency(bill.paidAmount)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[var(--color-text)]">
                                Due
                            </span>

                            <span className="text-base font-bold text-[var(--color-danger)]">
                                {formatCurrency(bill.dueAmount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {bill.payments && bill.payments.length > 0 && (
                    <div className="border-t border-[var(--color-border)] px-6 py-6 sm:px-8">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                            Payment History
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-sm">
                                <thead>
                                    <tr className="border-y border-[var(--color-border)] bg-slate-50">
                                        <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                            Date
                                        </th>

                                        <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                            Method
                                        </th>

                                        <th className="px-3 py-3 text-right font-semibold text-[var(--color-text-muted)]">
                                            Amount
                                        </th>

                                        <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                            Reference
                                        </th>

                                        <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                            Received By
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {bill.payments.map((payment, index) => (
                                        <tr
                                            key={payment._id || index}
                                            className="border-b border-[var(--color-border)]"
                                        >
                                            <td className="px-3 py-3 text-[var(--color-text)]">
                                                {formatDateTime(payment.paymentDate)}
                                            </td>

                                            <td className="px-3 py-3 text-[var(--color-text)]">
                                                {formatPaymentMethod(payment.paymentMethod)}
                                            </td>

                                            <td className="px-3 py-3 text-right font-semibold text-[var(--color-success)]">
                                                {formatCurrency(payment.amount)}
                                            </td>

                                            <td className="px-3 py-3 text-[var(--color-text)]">
                                                {payment.referenceNumber || '-'}
                                            </td>

                                            <td className="px-3 py-3 text-[var(--color-text)]">
                                                {payment.receivedBy?.name || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {bill.notes && (
                    <div className="border-t border-[var(--color-border)] px-6 py-6 sm:px-8">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                            Notes
                        </h3>

                        <div className="rounded-lg bg-slate-50 p-4">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                                {bill.notes}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="border-t-2 border-[var(--color-primary)] px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                This is a computer-generated bill/receipt.
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                Generated on {formatDateTime(new Date().toISOString())}
                            </p>
                        </div>

                        <div className="w-48 text-center">
                            <div className="mb-2 border-b border-[var(--color-text)]" />

                            <p className="text-xs font-medium text-[var(--color-text)]">
                                Authorized Signature
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs font-medium text-[var(--color-text)]">
                            Thank you for choosing ArogyaCare Diagnostics.
                        </p>

                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            Please retain this receipt for your records.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
