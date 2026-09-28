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
    dateOfBirth?: string;
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
    email?: string;
    clinicName?: string;
    hospitalName?: string;
    city?: string;
    referralType?: string;
}

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

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

interface BillPayment {
    _id: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    referenceNumber?: string;
    notes?: string;
    receivedBy?: {
        _id: string;
        name: string;
        email: string;
    } | null;
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
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline print:hidden"
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
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline print:hidden"
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
        <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
            {/* Action Bar */}
            <div className="mx-auto mb-4 flex max-w-[900px] items-center justify-between print:hidden">
                <Link
                    href={`/billing/${bill._id}`}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Bill
                </Link>

                <Button type="button" variant="primary" onClick={handlePrint}>
                    Print Receipt
                </Button>
            </div>

            {/* Receipt */}
            <div className="mx-auto max-w-[900px] bg-white px-8 py-8 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
                {/* Header */}
                <div className="border-b-2 border-[var(--color-primary)] pb-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-wide text-[var(--color-primary)]">
                                ArogyaCare Diagnostics
                            </h1>

                            <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                Diagnostic & Healthcare Centre
                            </p>

                            <p className="mt-2 max-w-md text-xs leading-5 text-[var(--color-text-muted)]">
                                Pathology • Radiology • Cardiology • Neurology • Diagnostic
                                Procedures
                            </p>
                        </div>

                        <div className="text-left sm:text-right">
                            <h2 className="text-xl font-bold uppercase tracking-wide text-[var(--color-text)]">
                                Bill Receipt
                            </h2>

                            <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">
                                {bill.billNumber}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                {formatDate(bill.billDate)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] py-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Bill Status
                        </p>

                        <div className="mt-1">
                            <Badge variant={getBillStatusVariant(bill.billStatus)} size="sm">
                                {bill.billStatus}
                            </Badge>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Payment Status
                        </p>

                        <div className="mt-1">
                            <Badge variant={getPaymentStatusVariant(bill.paymentStatus)} size="sm">
                                {bill.paymentStatus}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Patient & Doctor */}
                <div className="grid grid-cols-1 gap-6 border-b border-[var(--color-border)] py-5 sm:grid-cols-2">
                    {/* Patient */}
                    <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                            Patient Information
                        </h3>

                        <div className="space-y-1.5 text-sm">
                            <div className="flex">
                                <span className="w-28 text-[var(--color-text-muted)]">
                                    Patient ID
                                </span>

                                <span className="font-medium text-[var(--color-text)]">
                                    {bill.patient.patientId}
                                </span>
                            </div>

                            <div className="flex">
                                <span className="w-28 text-[var(--color-text-muted)]">Name</span>

                                <span className="font-medium text-[var(--color-text)]">
                                    {bill.patient.name}
                                </span>
                            </div>

                            <div className="flex">
                                <span className="w-28 text-[var(--color-text-muted)]">
                                    Gender / Age
                                </span>

                                <span className="text-[var(--color-text)]">
                                    {bill.patient.gender || '-'} / {bill.patient.age ?? '-'}
                                </span>
                            </div>

                            <div className="flex">
                                <span className="w-28 text-[var(--color-text-muted)]">Mobile</span>

                                <span className="text-[var(--color-text)]">
                                    {bill.patient.mobile || '-'}
                                </span>
                            </div>

                            <div className="flex">
                                <span className="w-28 text-[var(--color-text-muted)]">
                                    Blood Group
                                </span>

                                <span className="text-[var(--color-text)]">
                                    {bill.patient.bloodGroup || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Doctor */}
                    <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                            Referring Doctor
                        </h3>

                        {bill.doctor ? (
                            <div className="space-y-1.5 text-sm">
                                <div className="flex">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Doctor ID
                                    </span>

                                    <span className="font-medium text-[var(--color-text)]">
                                        {bill.doctor.doctorId}
                                    </span>
                                </div>

                                <div className="flex">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Name
                                    </span>

                                    <span className="font-medium text-[var(--color-text)]">
                                        {bill.doctor.name}
                                    </span>
                                </div>

                                <div className="flex">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Qualification
                                    </span>

                                    <span className="text-[var(--color-text)]">
                                        {bill.doctor.qualification || '-'}
                                    </span>
                                </div>

                                <div className="flex">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Specialization
                                    </span>

                                    <span className="text-[var(--color-text)]">
                                        {bill.doctor.specialization || '-'}
                                    </span>
                                </div>

                                <div className="flex">
                                    <span className="w-28 text-[var(--color-text-muted)]">
                                        Mobile
                                    </span>

                                    <span className="text-[var(--color-text)]">
                                        {bill.doctor.mobileNumber || '-'}
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

                {/* Test Items */}
                <div className="py-5">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                        Diagnostic Services
                    </h3>

                    <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="border-b border-[var(--color-border)] px-3 py-2.5 text-left font-semibold text-[var(--color-text)]">
                                        #
                                    </th>

                                    <th className="border-b border-[var(--color-border)] px-3 py-2.5 text-left font-semibold text-[var(--color-text)]">
                                        Test / Service
                                    </th>

                                    <th className="border-b border-[var(--color-border)] px-3 py-2.5 text-left font-semibold text-[var(--color-text)]">
                                        Code
                                    </th>

                                    <th className="border-b border-[var(--color-border)] px-3 py-2.5 text-center font-semibold text-[var(--color-text)]">
                                        Qty
                                    </th>

                                    <th className="border-b border-[var(--color-border)] px-3 py-2.5 text-right font-semibold text-[var(--color-text)]">
                                        Rate
                                    </th>

                                    <th className="border-b border-[var(--color-border)] px-3 py-2.5 text-right font-semibold text-[var(--color-text)]">
                                        Discount
                                    </th>

                                    <th className="border-b border-[var(--color-border)] px-3 py-2.5 text-right font-semibold text-[var(--color-text)]">
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {bill.items.map((item, index) => (
                                    <tr key={`${item.testCode}-${index}`}>
                                        <td className="border-b border-[var(--color-border)] px-3 py-2.5 text-[var(--color-text-muted)]">
                                            {index + 1}
                                        </td>

                                        <td className="border-b border-[var(--color-border)] px-3 py-2.5">
                                            <p className="font-medium text-[var(--color-text)]">
                                                {item.testName}
                                            </p>

                                            {typeof item.test !== 'string' && item.test && (
                                                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                                    {item.test.department ||
                                                        item.test.testType ||
                                                        ''}
                                                </p>
                                            )}
                                        </td>

                                        <td className="border-b border-[var(--color-border)] px-3 py-2.5 text-[var(--color-text)]">
                                            {item.testCode}
                                        </td>

                                        <td className="border-b border-[var(--color-border)] px-3 py-2.5 text-center text-[var(--color-text)]">
                                            {item.quantity}
                                        </td>

                                        <td className="border-b border-[var(--color-border)] px-3 py-2.5 text-right text-[var(--color-text)]">
                                            {formatCurrency(item.unitPrice)}
                                        </td>

                                        <td className="border-b border-[var(--color-border)] px-3 py-2.5 text-right text-[var(--color-text)]">
                                            {formatCurrency(item.discountAmount)}
                                        </td>

                                        <td className="border-b border-[var(--color-border)] px-3 py-2.5 text-right font-semibold text-[var(--color-text)]">
                                            {formatCurrency(item.totalAmount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="flex justify-end border-b border-[var(--color-border)] pb-5">
                    <div className="w-full max-w-sm space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Subtotal</span>

                            <span className="font-medium text-[var(--color-text)]">
                                {formatCurrency(bill.subtotal)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Discount</span>

                            <span className="font-medium text-red-600">
                                -{formatCurrency(bill.discountAmount)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Tax</span>

                            <span className="font-medium text-[var(--color-text)]">
                                {formatCurrency(bill.taxAmount)}
                            </span>
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-base font-bold text-[var(--color-text)]">
                                    Grand Total
                                </span>

                                <span className="text-lg font-bold text-[var(--color-primary)]">
                                    {formatCurrency(bill.grandTotal)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Paid</span>

                            <span className="font-semibold text-green-600">
                                {formatCurrency(bill.paidAmount)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2.5">
                            <span className="font-semibold text-[var(--color-text)]">Due</span>

                            <span className="text-base font-bold text-red-600">
                                {formatCurrency(bill.dueAmount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {bill.payments && bill.payments.length > 0 && (
                    <div className="border-b border-[var(--color-border)] py-5">
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                            Payment History
                        </h3>

                        <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="border-b border-[var(--color-border)] px-3 py-2 text-left font-semibold text-[var(--color-text)]">
                                            Date
                                        </th>

                                        <th className="border-b border-[var(--color-border)] px-3 py-2 text-left font-semibold text-[var(--color-text)]">
                                            Method
                                        </th>

                                        <th className="border-b border-[var(--color-border)] px-3 py-2 text-right font-semibold text-[var(--color-text)]">
                                            Amount
                                        </th>

                                        <th className="border-b border-[var(--color-border)] px-3 py-2 text-left font-semibold text-[var(--color-text)]">
                                            Reference
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {bill.payments.map((payment, index) => (
                                        <tr key={payment._id || index}>
                                            <td className="border-b border-[var(--color-border)] px-3 py-2 text-[var(--color-text)]">
                                                {formatDateTime(payment.paymentDate)}
                                            </td>

                                            <td className="border-b border-[var(--color-border)] px-3 py-2 text-[var(--color-text)]">
                                                {formatPaymentMethod(payment.paymentMethod)}
                                            </td>

                                            <td className="border-b border-[var(--color-border)] px-3 py-2 text-right font-semibold text-green-600">
                                                {formatCurrency(payment.amount)}
                                            </td>

                                            <td className="border-b border-[var(--color-border)] px-3 py-2 text-[var(--color-text)]">
                                                {payment.referenceNumber || '-'}
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
                    <div className="border-b border-[var(--color-border)] py-5">
                        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                            Notes
                        </h3>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">
                            {bill.notes}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="pt-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                Generated on {formatDateTime(new Date().toISOString())}
                            </p>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                This is a computer-generated bill receipt.
                            </p>
                        </div>

                        <div className="text-left sm:text-right">
                            <div className="mb-8 h-px w-48 bg-[var(--color-border)]" />

                            <p className="text-xs font-medium text-[var(--color-text)]">
                                Authorized Signature
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-[var(--color-border)] pt-3 text-center">
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Thank you for choosing ArogyaCare Diagnostics.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
