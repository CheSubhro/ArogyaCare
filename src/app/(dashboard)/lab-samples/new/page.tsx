'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
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
    gender?: string;
    mobileNumber?: string;
}

interface Test {
    _id: string;
    name: string;
    code: string;
    department?: string;
    testType: 'LABORATORY' | 'IMAGING' | 'CARDIOLOGY' | 'NEUROLOGY' | 'PROCEDURE' | 'OTHER';
    sampleType?: string;
    specimenSite?: string;
    modality?: string;
    price?: number;
}

interface FormData {
    patient: string;
    test: string;
    sampleType: string;
    specimenSite: string;
    collectionDateTime: string;
    collectedBy: string;
    receivedDateTime: string;
    receivedBy: string;
    status: 'PENDING' | 'COLLECTED' | 'RECEIVED' | 'REJECTED' | 'PROCESSED' | 'CANCELLED';
    rejectionReason: string;
    remarks: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialFormData: FormData = {
    patient: '',
    test: '',
    sampleType: '',
    specimenSite: '',
    collectionDateTime: '',
    collectedBy: '',
    receivedDateTime: '',
    receivedBy: '',
    status: 'PENDING',
    rejectionReason: '',
    remarks: '',
};

export default function AddLabSamplePage() {
    const router = useRouter();

    const [formData, setFormData] = useState<FormData>(initialFormData);

    const [patients, setPatients] = useState<Patient[]>([]);

    const [tests, setTests] = useState<Test[]>([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [patientsResponse, testsResponse] = await Promise.all([
                    fetch('/api/patients?status=ACTIVE', {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                    }),

                    fetch('/api/tests?status=ACTIVE', {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                    }),
                ]);

                const patientsData = await patientsResponse.json();

                const testsData = await testsResponse.json();

                if (patientsResponse.status === 401 || testsResponse.status === 401) {
                    router.replace('/login');
                    return;
                }

                if (!patientsResponse.ok) {
                    setError(patientsData.message || 'Unable to load patients.');

                    return;
                }

                if (!testsResponse.ok) {
                    setError(testsData.message || 'Unable to load tests.');

                    return;
                }

                setPatients(patientsData.patients || []);

                setTests(testsData.tests || []);
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: '',
        }));
    };

    const handleTestChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const testId = event.target.value;

        const selectedTest = tests.find((test) => test._id === testId);

        setFormData((previous) => ({
            ...previous,
            test: testId,
            sampleType: selectedTest?.sampleType || '',
            specimenSite: selectedTest?.specimenSite || '',
        }));

        setErrors((previous) => ({
            ...previous,
            test: '',
        }));
    };

    const validateForm = () => {
        const fieldErrors: FormErrors = {};

        if (!formData.patient) {
            fieldErrors.patient = 'Patient is required.';
        }

        if (!formData.test) {
            fieldErrors.test = 'Test is required.';
        }

        if (formData.status === 'REJECTED' && !formData.rejectionReason.trim()) {
            fieldErrors.rejectionReason = 'Rejection reason is required when sample is rejected.';
        }

        setErrors(fieldErrors);

        return Object.keys(fieldErrors).length === 0;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSaving(true);
        setError('');
        setErrors({});

        if (!validateForm()) {
            setSaving(false);
            return;
        }

        try {
            const payload = {
                patient: formData.patient,

                test: formData.test,

                sampleType: formData.sampleType.trim(),

                specimenSite: formData.specimenSite.trim(),

                collectionDateTime: formData.collectionDateTime,

                collectedBy: formData.collectedBy.trim(),

                receivedDateTime: formData.receivedDateTime,

                receivedBy: formData.receivedBy.trim(),

                status: formData.status,

                rejectionReason: formData.rejectionReason.trim(),

                remarks: formData.remarks.trim(),
            };

            const response = await fetch('/api/lab-samples', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    router.replace('/login');
                    return;
                }

                if (data.errors) {
                    const fieldErrors: FormErrors = {};

                    Object.entries(data.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages) && messages.length > 0) {
                            fieldErrors[field as keyof FormData] = String(messages[0]);
                        }
                    });

                    setErrors(fieldErrors);
                }

                setError(data.message || 'Unable to create lab sample.');

                return;
            }

            router.push('/lab-samples');
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-96 items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}

            <div className="mb-6">
                <Link
                    href="/lab-samples"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Lab Samples
                </Link>

                <h1 className="mt-3 text-2xl font-bold text-[var(--color-text)]">Add Lab Sample</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Create a new laboratory sample record.
                </p>
            </div>

            {error && (
                <div className="mb-6">
                    <Alert variant="danger">{error}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Patient & Test */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Patient & Test
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Select the patient and investigation for this sample.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Patient */}

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
                                name="patient"
                                value={formData.patient}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="">Select patient</option>

                                {patients.map((patient) => (
                                    <option key={patient._id} value={patient._id}>
                                        {patient.patientId} - {patient.name}
                                    </option>
                                ))}
                            </Select>

                            {errors.patient && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.patient}
                                </p>
                            )}
                        </div>

                        {/* Test */}

                        <div>
                            <label
                                htmlFor="test"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Test
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Select
                                id="test"
                                name="test"
                                value={formData.test}
                                onChange={handleTestChange}
                                disabled={saving}
                            >
                                <option value="">Select test</option>

                                {tests.map((test) => (
                                    <option key={test._id} value={test._id}>
                                        {test.code} - {test.name}
                                    </option>
                                ))}
                            </Select>

                            {errors.test && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.test}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Sample Information */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Sample Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update specimen and sample details.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Sample Type */}

                        <div>
                            <label
                                htmlFor="sampleType"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Sample Type
                            </label>

                            <Input
                                id="sampleType"
                                name="sampleType"
                                value={formData.sampleType}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. Whole Blood, Serum"
                            />

                            {errors.sampleType && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.sampleType}
                                </p>
                            )}
                        </div>

                        {/* Specimen Site */}

                        <div>
                            <label
                                htmlFor="specimenSite"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Specimen / Body Site
                            </label>

                            <Input
                                id="specimenSite"
                                name="specimenSite"
                                value={formData.specimenSite}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. Blood, Chest, Abdomen"
                            />

                            {errors.specimenSite && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.specimenSite}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Collection */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Collection
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Record when and by whom the sample was collected.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Collection Date */}

                        <div>
                            <label
                                htmlFor="collectionDateTime"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Collection Date & Time
                            </label>

                            <Input
                                id="collectionDateTime"
                                name="collectionDateTime"
                                type="datetime-local"
                                value={formData.collectionDateTime}
                                onChange={handleChange}
                                disabled={saving}
                            />

                            {errors.collectionDateTime && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.collectionDateTime}
                                </p>
                            )}
                        </div>

                        {/* Collected By */}

                        <div>
                            <label
                                htmlFor="collectedBy"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Collected By
                            </label>

                            <Input
                                id="collectedBy"
                                name="collectedBy"
                                value={formData.collectedBy}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter collector name"
                            />

                            {errors.collectedBy && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.collectedBy}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Receiving */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Receiving
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Record sample receipt at the laboratory.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Received Date */}

                        <div>
                            <label
                                htmlFor="receivedDateTime"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Received Date & Time
                            </label>

                            <Input
                                id="receivedDateTime"
                                name="receivedDateTime"
                                type="datetime-local"
                                value={formData.receivedDateTime}
                                onChange={handleChange}
                                disabled={saving}
                            />

                            {errors.receivedDateTime && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.receivedDateTime}
                                </p>
                            )}
                        </div>

                        {/* Received By */}

                        <div>
                            <label
                                htmlFor="receivedBy"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Received By
                            </label>

                            <Input
                                id="receivedBy"
                                name="receivedBy"
                                value={formData.receivedBy}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter receiver name"
                            />

                            {errors.receivedBy && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.receivedBy}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Status */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Sample Status
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Set the current status of the sample.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Status */}

                        <div>
                            <label
                                htmlFor="status"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Status
                            </label>

                            <Select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="PENDING">Pending</option>

                                <option value="COLLECTED">Collected</option>

                                <option value="RECEIVED">Received</option>

                                <option value="REJECTED">Rejected</option>

                                <option value="PROCESSED">Processed</option>

                                <option value="CANCELLED">Cancelled</option>
                            </Select>

                            {errors.status && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        {/* Rejection Reason */}

                        <div>
                            <label
                                htmlFor="rejectionReason"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Rejection Reason
                                {formData.status === 'REJECTED' && (
                                    <span className="ml-1 text-[var(--color-danger)]">*</span>
                                )}
                            </label>

                            <Input
                                id="rejectionReason"
                                name="rejectionReason"
                                value={formData.rejectionReason}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter reason if rejected"
                            />

                            {errors.rejectionReason && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.rejectionReason}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Remarks */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">Remarks</h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Add any additional information about the sample.
                        </p>
                    </div>

                    <div className="p-6">
                        <Textarea
                            id="remarks"
                            name="remarks"
                            rows={5}
                            value={formData.remarks}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Enter sample remarks"
                        />

                        {errors.remarks && (
                            <p className="mt-1 text-xs text-[var(--color-danger)]">
                                {errors.remarks}
                            </p>
                        )}
                    </div>
                </Card>

                {/* Actions */}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link href="/lab-samples">
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                    </Link>

                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                        {saving ? 'Saving...' : 'Create Sample'}
                    </Button>
                </div>
            </form>
        </div>
    );
}