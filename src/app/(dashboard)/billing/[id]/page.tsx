'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';

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

export default function BillDetailsPage() {
    const params = useParams();

    const id = params.id as string;

    const [bill, setBill] = useState<Bill | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [statusAction, setStatusAction] = useState<'CONFIRMED' | 'CANCELLED' | null>(null);

    const [statusUpdating, setStatusUpdating] = useState(false);

    const [statusError, setStatusError] = useState('');

    /*
     * Payment modal state
     */
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const [paymentAmount, setPaymentAmount] = useState('');

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

    const [paymentDate, setPaymentDate] = useState('');

    const [referenceNumber, setReferenceNumber] = useState('');

    const [paymentNotes, setPaymentNotes] = useState('');

    const [paymentSubmitting, setPaymentSubmitting] = useState(false);

    const [paymentError, setPaymentError] = useState('');

    const [paymentSuccess, setPaymentSuccess] = useState('');

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

    /*
     * Update bill status
     */
    const updateBillStatus = async (newStatus: 'CONFIRMED' | 'CANCELLED') => {
        if (!bill) {
            return;
        }

        setStatusUpdating(true);
        setStatusError('');

        try {
            const response = await fetch(`/api/bills/${bill._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    billStatus: newStatus,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setStatusError(data.message || 'Failed to update bill status.');
                return;
            }

            setBill(data.bill);
            setStatusAction(null);
        } catch {
            setStatusError('Something went wrong while updating the bill status.');
        } finally {
            setStatusUpdating(false);
        }
    };

    /*
     * Open payment modal
     */
    const openPaymentModal = () => {
        if (!bill) {
            return;
        }

        setPaymentError('');
        setPaymentSuccess('');

        setPaymentAmount(bill.dueAmount > 0 ? bill.dueAmount.toFixed(2) : '');

        setPaymentMethod('CASH');

        setPaymentDate(new Date().toISOString().slice(0, 10));

        setReferenceNumber('');
        setPaymentNotes('');

        setPaymentModalOpen(true);
    };

    /*
     * Close payment modal
     */
    const closePaymentModal = () => {
        if (paymentSubmitting) {
            return;
        }

        setPaymentModalOpen(false);
        setPaymentError('');
    };

    /*
     * Submit payment
     */
    const collectPayment = async () => {
        if (!bill) {
            return;
        }

        setPaymentError('');
        setPaymentSuccess('');

        const amount = Number(paymentAmount);

        if (!paymentAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
            setPaymentError('Please enter a valid payment amount.');
            return;
        }

        if (amount > bill.dueAmount) {
            setPaymentError(
                `Payment cannot exceed the due amount of ${formatCurrency(bill.dueAmount)}.`,
            );
            return;
        }

        if (!paymentMethod) {
            setPaymentError('Please select a payment method.');
            return;
        }

        setPaymentSubmitting(true);

        try {
            const response = await fetch(`/api/bills/${bill._id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    amount,
                    paymentMethod,
                    paymentDate: paymentDate
                        ? new Date(`${paymentDate}T00:00:00`).toISOString()
                        : undefined,
                    referenceNumber: referenceNumber.trim() || undefined,
                    notes: paymentNotes.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setPaymentError(data.message || 'Failed to collect payment.');
                return;
            }

            setBill(data.bill);

            setPaymentSuccess('Payment collected successfully.');

            setPaymentAmount('');
            setReferenceNumber('');
            setPaymentNotes('');

            setTimeout(() => {
                setPaymentModalOpen(false);
                setPaymentSuccess('');
            }, 800);
        } catch {
            setPaymentError('Something went wrong while collecting payment.');
        } finally {
            setPaymentSubmitting(false);
        }
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
                    href="/billing"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Billing
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
                    href="/billing"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Billing
                </Link>

                <Alert variant="danger">
                    <p className="text-sm">Bill not found.</p>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/billing"
                        className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Billing
                    </Link>

                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Bill Details</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        View billing and payment information.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getBillStatusVariant(bill.billStatus)}>{bill.billStatus}</Badge>

                    <Badge variant={getPaymentStatusVariant(bill.paymentStatus)}>
                        {bill.paymentStatus}
                    </Badge>
                </div>
            </div>

            {/* Status Error */}
            {statusError && (
                <Alert variant="danger">
                    <p className="text-sm">{statusError}</p>
                </Alert>
            )}

            {/* Payment Success */}
            {paymentSuccess && (
                <Alert variant="success">
                    <p className="text-sm">{paymentSuccess}</p>
                </Alert>
            )}

            {/* Bill Status */}
            {bill.billStatus !== 'CANCELLED' && (
                <Card>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--color-text)]">
                                Bill Status
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Manage the current status of this bill.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {bill.billStatus === 'CONFIRMED' && bill.dueAmount > 0 && (
                                <Button type="button" variant="primary" onClick={openPaymentModal}>
                                    Collect Payment
                                </Button>
                            )}

                            {bill.billStatus === 'DRAFT' && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => setStatusAction('CONFIRMED')}
                                >
                                    Confirm Bill
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="danger"
                                onClick={() => setStatusAction('CANCELLED')}
                            >
                                Cancel Bill
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Cancelled */}
            {bill.billStatus === 'CANCELLED' && (
                <Alert variant="danger">
                    <p className="text-sm">This bill has been cancelled and cannot be modified.</p>
                </Alert>
            )}

            {/* Fully Paid */}
            {bill.billStatus === 'CONFIRMED' && bill.dueAmount <= 0 && (
                <Alert variant="success">
                    <p className="text-sm">This bill has been fully paid.</p>
                </Alert>
            )}

            {/* Bill Information */}
            <Card>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Bill Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Basic billing information
                        </p>
                    </div>

                    <span className="text-lg font-semibold text-[var(--color-primary)]">
                        {bill.billNumber}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Bill Number
                        </p>

                        <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                            {bill.billNumber}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Bill Date
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDate(bill.billDate)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Created At
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDateTime(bill.createdAt)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Updated At
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDateTime(bill.updatedAt)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Patient & Doctor */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Patient */}
                <Card>
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Patient Information
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Patient linked to this bill
                            </p>
                        </div>

                        <Link
                            href={`/patients/${bill.patient._id}`}
                            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                        >
                            View Patient
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Patient ID
                            </p>

                            <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                {bill.patient.patientId}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Name
                            </p>

                            <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                {bill.patient.name}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Gender
                            </p>

                            <p className="mt-1 text-sm text-[var(--color-text)]">
                                {bill.patient.gender || '-'}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Age
                            </p>

                            <p className="mt-1 text-sm text-[var(--color-text)]">
                                {bill.patient.age ?? '-'}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Mobile
                            </p>

                            <p className="mt-1 text-sm text-[var(--color-text)]">
                                {bill.patient.mobile || '-'}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Blood Group
                            </p>

                            <p className="mt-1 text-sm text-[var(--color-text)]">
                                {bill.patient.bloodGroup || '-'}
                            </p>
                        </div>

                        <div className="sm:col-span-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Address
                            </p>

                            <p className="mt-1 text-sm text-[var(--color-text)]">
                                {[bill.patient.address, bill.patient.city]
                                    .filter(Boolean)
                                    .join(', ') || '-'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Doctor */}
                <Card>
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Referring Doctor
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Doctor linked to this bill
                            </p>
                        </div>

                        {bill.doctor && (
                            <Link
                                href={`/doctors/${bill.doctor._id}`}
                                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                            >
                                View Doctor
                            </Link>
                        )}
                    </div>

                    {bill.doctor ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Doctor ID
                                </p>

                                <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {bill.doctor.doctorId}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Name
                                </p>

                                <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                                    {bill.doctor.name}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Qualification
                                </p>

                                <p className="mt-1 text-sm text-[var(--color-text)]">
                                    {bill.doctor.qualification || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Specialization
                                </p>

                                <p className="mt-1 text-sm text-[var(--color-text)]">
                                    {bill.doctor.specialization || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Registration No.
                                </p>

                                <p className="mt-1 text-sm text-[var(--color-text)]">
                                    {bill.doctor.registrationNumber || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Mobile
                                </p>

                                <p className="mt-1 text-sm text-[var(--color-text)]">
                                    {bill.doctor.mobileNumber || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Clinic
                                </p>

                                <p className="mt-1 text-sm text-[var(--color-text)]">
                                    {bill.doctor.clinicName || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Hospital
                                </p>

                                <p className="mt-1 text-sm text-[var(--color-text)]">
                                    {bill.doctor.hospitalName || '-'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center">
                            <p className="text-sm text-[var(--color-text-muted)]">
                                No referring doctor was associated with this bill.
                            </p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Bill Items */}
            <Card>
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Bill Items</h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Tests and charges included in this bill
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm">
                        <thead>
                            <tr className="border-b border-[var(--color-border)]">
                                <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                    #
                                </th>

                                <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-muted)]">
                                    Test
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
                                    Total
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {bill.items.map((item, index) => (
                                <tr
                                    key={`${item.testCode}-${index}`}
                                    className="border-b border-[var(--color-border)] last:border-b-0"
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
                                                {item.test.department || item.test.testType || '-'}
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
            </Card>

            {/* Payment Information */}
            <Card>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Payment Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Payment and collection details
                        </p>
                    </div>

                    {bill.billStatus === 'CONFIRMED' && bill.dueAmount > 0 && (
                        <Button type="button" variant="primary" onClick={openPaymentModal}>
                            Collect Payment
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Payment Status
                        </p>

                        <div className="mt-2">
                            <Badge variant={getPaymentStatusVariant(bill.paymentStatus)}>
                                {bill.paymentStatus}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Latest Payment Method
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatPaymentMethod(bill.paymentMethod)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Paid Amount
                        </p>

                        <p className="mt-1 text-lg font-semibold text-[var(--color-success)]">
                            {formatCurrency(bill.paidAmount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Due Amount
                        </p>

                        <p className="mt-1 text-lg font-semibold text-[var(--color-danger)]">
                            {formatCurrency(bill.dueAmount)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Payment History */}
            <Card>
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Payment History
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        All payment transactions for this bill
                    </p>
                </div>

                {bill.payments && bill.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
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
                                        className="border-b border-[var(--color-border)] last:border-b-0"
                                    >
                                        <td className="px-3 py-3 text-[var(--color-text)]">
                                            {formatDateTime(payment.paymentDate)}
                                        </td>

                                        <td className="px-3 py-3">
                                            <Badge variant="info">
                                                {formatPaymentMethod(payment.paymentMethod)}
                                            </Badge>
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
                ) : (
                    <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            No payment transactions have been recorded yet.
                        </p>
                    </div>
                )}
            </Card>

            {/* Bill Summary */}
            <Card>
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Bill Summary</h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Complete financial summary
                    </p>
                </div>

                <div className="max-w-xl space-y-3">
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
                        <span className="text-sm font-medium text-[var(--color-text)]">Due</span>

                        <span className="text-base font-bold text-[var(--color-danger)]">
                            {formatCurrency(bill.dueAmount)}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Notes */}
            {bill.notes && (
                <Card>
                    <div className="mb-3">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">Notes</h2>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                            {bill.notes}
                        </p>
                    </div>
                </Card>
            )}

            {/* Status Confirmation Modal */}
            <Modal
                open={statusAction !== null}
                onClose={() => {
                    if (!statusUpdating) {
                        setStatusAction(null);
                    }
                }}
                title={statusAction === 'CONFIRMED' ? 'Confirm Bill' : 'Cancel Bill'}
            >
                <div className="space-y-5">
                    <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                        {statusAction === 'CONFIRMED'
                            ? `Are you sure you want to confirm bill ${bill.billNumber}?`
                            : `Are you sure you want to cancel bill ${bill.billNumber}? This action cannot be reversed.`}
                    </p>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={() => setStatusAction(null)}
                            disabled={statusUpdating}
                        >
                            No, Go Back
                        </Button>

                        <Button
                            type="button"
                            variant={statusAction === 'CANCELLED' ? 'danger' : 'primary'}
                            onClick={() => {
                                if (statusAction) {
                                    updateBillStatus(statusAction);
                                }
                            }}
                            disabled={statusUpdating}
                        >
                            {statusUpdating
                                ? 'Updating...'
                                : statusAction === 'CONFIRMED'
                                  ? 'Yes, Confirm'
                                  : 'Yes, Cancel Bill'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Collect Payment Modal */}
            <Modal open={paymentModalOpen} onClose={closePaymentModal} title="Collect Payment">
                <div className="space-y-5">
                    {/* Bill Payment Summary */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                Bill Total
                            </p>

                            <p className="mt-1 text-base font-semibold text-[var(--color-text)]">
                                {formatCurrency(bill.grandTotal)}
                            </p>
                        </div>

                        <div className="rounded-lg bg-green-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                                Paid
                            </p>

                            <p className="mt-1 text-base font-semibold text-green-700">
                                {formatCurrency(bill.paidAmount)}
                            </p>
                        </div>

                        <div className="rounded-lg bg-red-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                                Due
                            </p>

                            <p className="mt-1 text-base font-semibold text-red-700">
                                {formatCurrency(bill.dueAmount)}
                            </p>
                        </div>
                    </div>

                    {paymentError && (
                        <Alert variant="danger">
                            <p className="text-sm">{paymentError}</p>
                        </Alert>
                    )}

                    {paymentSuccess && (
                        <Alert variant="success">
                            <p className="text-sm">{paymentSuccess}</p>
                        </Alert>
                    )}

                    {/* Amount */}
                    <div>
                        <label
                            htmlFor="paymentAmount"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Payment Amount
                        </label>

                        <Input
                            id="paymentAmount"
                            type="number"
                            min="0.01"
                            max={bill.dueAmount}
                            step="0.01"
                            value={paymentAmount}
                            onChange={(event) => setPaymentAmount(event.target.value)}
                            placeholder="Enter payment amount"
                            disabled={paymentSubmitting}
                        />

                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            Maximum payable amount: {formatCurrency(bill.dueAmount)}
                        </p>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label
                            htmlFor="paymentMethod"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Payment Method
                        </label>

                        <Select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={(event) =>
                                setPaymentMethod(event.target.value as PaymentMethod)
                            }
                            disabled={paymentSubmitting}
                        >
                            <option value="CASH">Cash</option>

                            <option value="UPI">UPI</option>

                            <option value="CARD">Card</option>

                            <option value="BANK_TRANSFER">Bank Transfer</option>

                            <option value="OTHER">Other</option>
                        </Select>
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label
                            htmlFor="paymentDate"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Payment Date
                        </label>

                        <Input
                            id="paymentDate"
                            type="date"
                            value={paymentDate}
                            onChange={(event) => setPaymentDate(event.target.value)}
                            disabled={paymentSubmitting}
                        />
                    </div>

                    {/* Reference */}
                    <div>
                        <label
                            htmlFor="referenceNumber"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Reference Number
                            <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">
                                (Optional)
                            </span>
                        </label>

                        <Input
                            id="referenceNumber"
                            type="text"
                            value={referenceNumber}
                            onChange={(event) => setReferenceNumber(event.target.value)}
                            placeholder="Transaction / receipt reference"
                            maxLength={100}
                            disabled={paymentSubmitting}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label
                            htmlFor="paymentNotes"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Notes
                            <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">
                                (Optional)
                            </span>
                        </label>

                        <Textarea
                            id="paymentNotes"
                            value={paymentNotes}
                            onChange={(event) => setPaymentNotes(event.target.value)}
                            placeholder="Payment related notes"
                            rows={3}
                            maxLength={500}
                            disabled={paymentSubmitting}
                        />
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            onClick={closePaymentModal}
                            disabled={paymentSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            onClick={collectPayment}
                            disabled={paymentSubmitting}
                        >
                            {paymentSubmitting ? 'Collecting...' : 'Collect Payment'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}