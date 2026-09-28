'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';

interface Patient {
    _id: string;
    patientId: string;
    name: string;
    mobile?: string;
    status?: string;
}

interface Doctor {
    _id: string;
    doctorId: string;
    name: string;
    specialization?: string;
    status?: string;
}

interface Test {
    _id: string;
    name: string;
    code: string;
    price: number;
    discountAllowed: boolean;
    status?: string;
    department?: string;
    testType?: string;
}

interface BillItem {
    test: string;
    quantity: number;
    discountAmount: number;
}

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

type BillStatus = 'DRAFT' | 'CONFIRMED';

function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function getTodayDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function CreateBillPage() {
    const router = useRouter();

    const [patients, setPatients] = useState<Patient[]>([]);

    const [doctors, setDoctors] = useState<Doctor[]>([]);

    const [tests, setTests] = useState<Test[]>([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [patient, setPatient] = useState('');

    const [doctor, setDoctor] = useState('');

    const [billDate, setBillDate] = useState(getTodayDateTime());

    const [items, setItems] = useState<BillItem[]>([]);

    const [billDiscount, setBillDiscount] = useState('0');

    const [taxAmount, setTaxAmount] = useState('0');

    const [paidAmount, setPaidAmount] = useState('0');

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

    const [billStatus, setBillStatus] = useState<BillStatus>('CONFIRMED');

    const [notes, setNotes] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [patientsResponse, doctorsResponse, testsResponse] = await Promise.all([
                    fetch('/api/patients?status=ACTIVE', {
                        credentials: 'include',
                        cache: 'no-store',
                    }),
                    fetch('/api/doctors?status=ACTIVE', {
                        credentials: 'include',
                        cache: 'no-store',
                    }),
                    fetch('/api/tests?status=ACTIVE', {
                        credentials: 'include',
                        cache: 'no-store',
                    }),
                ]);

                const patientsData = await patientsResponse.json();

                const doctorsData = await doctorsResponse.json();

                const testsData = await testsResponse.json();

                if (
                    patientsResponse.status === 401 ||
                    doctorsResponse.status === 401 ||
                    testsResponse.status === 401
                ) {
                    router.replace('/login');
                    return;
                }

                if (!patientsResponse.ok) {
                    setError(patientsData.message || 'Failed to load patients.');
                    return;
                }

                if (!doctorsResponse.ok) {
                    setError(doctorsData.message || 'Failed to load doctors.');
                    return;
                }

                if (!testsResponse.ok) {
                    setError(testsData.message || 'Failed to load tests.');
                    return;
                }

                setPatients(patientsData.patients || []);

                setDoctors(doctorsData.doctors || []);

                setTests(testsData.tests || []);
            } catch {
                setError('Unable to connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    const selectedTests = useMemo(() => {
        return items
            .map((item) => {
                const test = tests.find((test) => test._id === item.test);

                return {
                    item,
                    test,
                };
            })
            .filter(
                (
                    value,
                ): value is {
                    item: BillItem;
                    test: Test;
                } => Boolean(value.test),
            );
    }, [items, tests]);

    const subtotal = useMemo(() => {
        return Number(
            selectedTests
                .reduce((sum, { item, test }) => sum + test.price * item.quantity, 0)
                .toFixed(2),
        );
    }, [selectedTests]);

    const itemDiscountTotal = useMemo(() => {
        return Number(
            selectedTests
                .reduce((sum, { item }) => sum + Number(item.discountAmount || 0), 0)
                .toFixed(2),
        );
    }, [selectedTests]);

    const billDiscountAmount = Math.max(0, Number(billDiscount) || 0);

    const tax = Math.max(0, Number(taxAmount) || 0);

    const grandTotal = Math.max(
        0,
        Number((subtotal - itemDiscountTotal - billDiscountAmount + tax).toFixed(2)),
    );

    const paid = Math.max(0, Number(paidAmount) || 0);

    const due = Math.max(0, Number((grandTotal - paid).toFixed(2)));

    const paymentStatus = paid === 0 ? 'UNPAID' : paid >= grandTotal ? 'PAID' : 'PARTIAL';

    const addTest = () => {
        setItems((previous) => [
            ...previous,
            {
                test: '',
                quantity: 1,
                discountAmount: 0,
            },
        ]);
    };

    const removeTest = (index: number) => {
        setItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    };

    const updateItem = (index: number, field: keyof BillItem, value: string | number) => {
        setItems((previous) =>
            previous.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item,
            ),
        );
    };

    const handleTestChange = (index: number, value: string) => {
        setItems((previous) =>
            previous.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          test: value,
                          discountAmount: 0,
                      }
                    : item,
            ),
        );
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError('');
        setFieldErrors({});

        const newErrors: Record<string, string> = {};

        if (!patient) {
            newErrors.patient = 'Patient is required.';
        }

        if (!billDate) {
            newErrors.billDate = 'Bill date is required.';
        }

        if (items.length === 0) {
            newErrors.items = 'At least one test is required.';
        }

        items.forEach((item, index) => {
            if (!item.test) {
                newErrors[`test_${index}`] = 'Please select a test.';
            }

            if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
                newErrors[`quantity_${index}`] = 'Quantity must be at least 1.';
            }

            if (Number(item.discountAmount) < 0) {
                newErrors[`discount_${index}`] = 'Discount cannot be negative.';
            }
        });

        if (billDiscountAmount > subtotal) {
            newErrors.billDiscount = 'Bill discount cannot exceed the bill amount.';
        }

        if (paid > grandTotal) {
            newErrors.paidAmount = 'Paid amount cannot exceed grand total.';
        }

        if (paid > 0 && !paymentMethod) {
            newErrors.paymentMethod = 'Payment method is required when payment is received.';
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        try {
            setSaving(true);

            const response = await fetch('/api/bills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    patient,
                    doctor,
                    items: items.map((item) => {
                        const test = tests.find((test) => test._id === item.test);

                        return {
                            test: item.test,
                            testName: test?.name || '',
                            testCode: test?.code || '',
                            quantity: Number(item.quantity),
                            unitPrice: Number(test?.price || 0),
                            discountAmount: Number(item.discountAmount || 0),
                            totalAmount: Number(
                                (
                                    Number(item.quantity) * Number(test?.price || 0) -
                                    Number(item.discountAmount || 0)
                                ).toFixed(2),
                            ),
                        };
                    }),
                    subtotal,
                    discountAmount: billDiscountAmount,
                    taxAmount: tax,
                    grandTotal,
                    paidAmount: paid,
                    dueAmount: due,
                    paymentStatus,
                    paymentMethod: paymentMethod || undefined,
                    billStatus,
                    billDate,
                    notes,
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                router.replace('/login');
                return;
            }

            if (!response.ok) {
                if (data.errors) {
                    const flattenedErrors = Object.entries(data.errors).reduce(
                        (result, [key, value]) => {
                            if (Array.isArray(value)) {
                                result[key] = String(value[0]);
                            }

                            return result;
                        },
                        {} as Record<string, string>,
                    );

                    setFieldErrors(flattenedErrors);
                }

                setError(data.message || 'Failed to create bill.');

                return;
            }

            router.push(`/billing/${data.bill._id}`);
        } catch {
            setError('Unable to connect to the server.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner />
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

                <h1 className="mt-3 text-2xl font-bold text-[var(--color-text)]">Create Bill</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Create a diagnostic bill for a patient.
                </p>
            </div>

            {error && (
                <div className="mb-6">
                    <Alert variant="danger">
                        <p className="text-sm">{error}</p>
                    </Alert>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Patient & Bill Information */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Bill Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Select the patient and billing information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label
                                htmlFor="patient"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Patient
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Select
                                id="patient"
                                value={patient}
                                onChange={(event) => {
                                    setPatient(event.target.value);

                                    setFieldErrors((previous) => ({
                                        ...previous,
                                        patient: '',
                                    }));
                                }}
                                disabled={saving}
                            >
                                <option value="">Select patient</option>

                                {patients.map((patient) => (
                                    <option key={patient._id} value={patient._id}>
                                        {patient.patientId} - {patient.name}
                                    </option>
                                ))}
                            </Select>

                            {fieldErrors.patient && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {fieldErrors.patient}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="doctor"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Referring Doctor
                            </label>

                            <Select
                                id="doctor"
                                value={doctor}
                                onChange={(event) => setDoctor(event.target.value)}
                                disabled={saving}
                            >
                                <option value="">Select doctor</option>

                                {doctors.map((doctor) => (
                                    <option key={doctor._id} value={doctor._id}>
                                        {doctor.doctorId} - {doctor.name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <label
                                htmlFor="billDate"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Bill Date & Time
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="billDate"
                                type="datetime-local"
                                value={billDate}
                                onChange={(event) => setBillDate(event.target.value)}
                                disabled={saving}
                            />

                            {fieldErrors.billDate && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {fieldErrors.billDate}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Tests */}
                <Card className="mb-6">
                    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Tests
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Add one or more tests to this bill.
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={addTest}
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            + Add Test
                        </Button>
                    </div>

                    <div className="p-6">
                        {fieldErrors.items && (
                            <p className="mb-4 text-sm text-[var(--color-danger)]">
                                {fieldErrors.items}
                            </p>
                        )}

                        {items.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center">
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    No tests added yet.
                                </p>

                                <Button type="button" className="mt-4" onClick={addTest}>
                                    Add First Test
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, index) => {
                                    const test = tests.find((test) => test._id === item.test);

                                    const itemSubtotal = test ? test.price * item.quantity : 0;

                                    const itemTotal = Math.max(
                                        0,
                                        itemSubtotal - Number(item.discountAmount || 0),
                                    );

                                    return (
                                        <div
                                            key={index}
                                            className="rounded-lg border border-[var(--color-border)] p-4"
                                        >
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                                                <div className="lg:col-span-5">
                                                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                                        Test
                                                    </label>

                                                    <Select
                                                        value={item.test}
                                                        onChange={(event) =>
                                                            handleTestChange(
                                                                index,
                                                                event.target.value,
                                                            )
                                                        }
                                                        disabled={saving}
                                                    >
                                                        <option value="">Select test</option>

                                                        {tests.map((test) => (
                                                            <option key={test._id} value={test._id}>
                                                                {test.code} - {test.name} (
                                                                {formatCurrency(test.price)})
                                                            </option>
                                                        ))}
                                                    </Select>

                                                    {fieldErrors[`test_${index}`] && (
                                                        <p className="mt-1 text-xs text-[var(--color-danger)]">
                                                            {fieldErrors[`test_${index}`]}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="lg:col-span-2">
                                                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                                        Quantity
                                                    </label>

                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={(event) =>
                                                            updateItem(
                                                                index,
                                                                'quantity',
                                                                Number(event.target.value),
                                                            )
                                                        }
                                                        disabled={saving}
                                                    />

                                                    {fieldErrors[`quantity_${index}`] && (
                                                        <p className="mt-1 text-xs text-[var(--color-danger)]">
                                                            {fieldErrors[`quantity_${index}`]}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="lg:col-span-2">
                                                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                                        Unit Price
                                                    </label>

                                                    <Input
                                                        value={
                                                            test
                                                                ? formatCurrency(test.price)
                                                                : '₹0.00'
                                                        }
                                                        readOnly
                                                        disabled
                                                    />
                                                </div>

                                                <div className="lg:col-span-2">
                                                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                                        Discount
                                                    </label>

                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.discountAmount}
                                                        onChange={(event) =>
                                                            updateItem(
                                                                index,
                                                                'discountAmount',
                                                                Number(event.target.value),
                                                            )
                                                        }
                                                        disabled={saving || !test?.discountAllowed}
                                                    />

                                                    {!test?.discountAllowed && test && (
                                                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                            Discount not allowed
                                                        </p>
                                                    )}

                                                    {fieldErrors[`discount_${index}`] && (
                                                        <p className="mt-1 text-xs text-[var(--color-danger)]">
                                                            {fieldErrors[`discount_${index}`]}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="lg:col-span-1">
                                                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                                        Total
                                                    </label>

                                                    <div className="flex h-[42px] items-center text-sm font-semibold text-[var(--color-text)]">
                                                        {formatCurrency(itemTotal)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeTest(index)}
                                                    disabled={saving}
                                                    className="text-sm font-medium text-[var(--color-danger)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Payment */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">Payment</h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Apply discount, tax and record the payment.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                Bill Discount
                            </label>

                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={billDiscount}
                                onChange={(event) => setBillDiscount(event.target.value)}
                                disabled={saving}
                            />

                            {fieldErrors.billDiscount && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {fieldErrors.billDiscount}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                                Tax
                            </label>

                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={taxAmount}
                                onChange={(event) => setTaxAmount(event.target.value)}
                                disabled={saving}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="paidAmount"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Paid Amount
                            </label>

                            <Input
                                id="paidAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={paidAmount}
                                onChange={(event) => setPaidAmount(event.target.value)}
                                disabled={saving}
                            />

                            {fieldErrors.paidAmount && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {fieldErrors.paidAmount}
                                </p>
                            )}
                        </div>

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
                                    setPaymentMethod(event.target.value as PaymentMethod | '')
                                }
                                disabled={saving}
                            >
                                <option value="">Select payment method</option>

                                <option value="CASH">Cash</option>

                                <option value="UPI">UPI</option>

                                <option value="CARD">Card</option>

                                <option value="BANK_TRANSFER">Bank Transfer</option>

                                <option value="OTHER">Other</option>
                            </Select>

                            {fieldErrors.paymentMethod && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {fieldErrors.paymentMethod}
                                </p>
                            )}
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
                                onChange={(event) =>
                                    setBillStatus(event.target.value as BillStatus)
                                }
                                disabled={saving}
                            >
                                <option value="CONFIRMED">Confirmed</option>

                                <option value="DRAFT">Draft</option>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Summary */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Bill Summary
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="ml-auto max-w-md space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Subtotal</span>

                                <span className="font-medium text-[var(--color-text)]">
                                    {formatCurrency(subtotal)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">
                                    Item Discount
                                </span>

                                <span className="font-medium text-red-600">
                                    -{formatCurrency(itemDiscountTotal)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">
                                    Bill Discount
                                </span>

                                <span className="font-medium text-red-600">
                                    -{formatCurrency(billDiscountAmount)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Tax</span>

                                <span className="font-medium text-[var(--color-text)]">
                                    {formatCurrency(tax)}
                                </span>
                            </div>

                            <div className="border-t border-[var(--color-border)] pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[var(--color-text)]">
                                        Grand Total
                                    </span>

                                    <span className="text-xl font-bold text-[var(--color-primary)]">
                                        {formatCurrency(grandTotal)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Paid</span>

                                <span className="font-semibold text-green-700">
                                    {formatCurrency(paid)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Due</span>

                                <span className="font-semibold text-red-600">
                                    {formatCurrency(due)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text-muted)]">
                                    Payment Status
                                </span>

                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                    {paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Notes */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">Notes</h2>
                    </div>

                    <div className="p-6">
                        <Textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={4}
                            placeholder="Enter any billing notes..."
                            disabled={saving}
                        />
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link href="/billing">
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                    </Link>

                    <Button
                        type="submit"
                        disabled={saving || items.length === 0}
                        className="w-full sm:w-auto"
                    >
                        {saving ? 'Creating...' : 'Create Bill'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
