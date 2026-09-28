'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';

type LabSampleStatus =
    'PENDING' | 'COLLECTED' | 'RECEIVED' | 'REJECTED' | 'PROCESSED' | 'CANCELLED';

interface Patient {
    _id: string;
    patientId: string;
    name: string;
    gender?: string;
    mobile?: string;
    status?: string;
}

interface Test {
    _id: string;
    name: string;
    code: string;
    department?: string;
    testType?: string;
    sampleType?: string;
    specimenSite?: string;
    modality?: string;
    status?: string;
}

interface LabSample {
    _id: string;
    sampleId: string;
    patient: Patient;
    test: Test;
    sampleType?: string;
    specimenSite?: string;
    collectionDateTime?: string;
    collectedBy?: string;
    receivedDateTime?: string;
    receivedBy?: string;
    status: LabSampleStatus;
    rejectionReason?: string;
    remarks?: string;
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
    status: LabSampleStatus;
    rejectionReason: string;
    remarks: string;
}

interface FormErrors {
    patient?: string;
    test?: string;
    sampleType?: string;
    specimenSite?: string;
    collectionDateTime?: string;
    collectedBy?: string;
    receivedDateTime?: string;
    receivedBy?: string;
    status?: string;
    rejectionReason?: string;
    remarks?: string;
}

const statusOptions: LabSampleStatus[] = [
    'PENDING',
    'COLLECTED',
    'RECEIVED',
    'REJECTED',
    'PROCESSED',
    'CANCELLED',
];

function toDateTimeLocal(value?: string) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatStatus(status: LabSampleStatus) {
    return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function EditLabSamplePage() {
    const params = useParams();
    const router = useRouter();

    const sampleId = params.id as string;

    const [sample, setSample] = useState<LabSample | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [tests, setTests] = useState<Test[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});

    const [formData, setFormData] = useState<FormData>({
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
    });

    useEffect(() => {
        if (!sampleId) {
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [sampleResponse, patientsResponse, testsResponse] = await Promise.all([
                    fetch(`/api/lab-samples/${sampleId}`, {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                    }),
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

                const sampleData = await sampleResponse.json();

                const patientsData = await patientsResponse.json();

                const testsData = await testsResponse.json();

                if (
                    sampleResponse.status === 401 ||
                    patientsResponse.status === 401 ||
                    testsResponse.status === 401
                ) {
                    router.replace('/login');
                    return;
                }

                if (!sampleResponse.ok) {
                    setError(sampleData.message || 'Failed to load lab sample.');
                    return;
                }

                if (!patientsResponse.ok) {
                    setError(patientsData.message || 'Failed to load patients.');
                    return;
                }

                if (!testsResponse.ok) {
                    setError(testsData.message || 'Failed to load tests.');
                    return;
                }

                const loadedSample = sampleData.sample as LabSample;

                const loadedPatients = (patientsData.patients || []) as Patient[];

                const loadedTests = (testsData.tests || []) as Test[];

                setSample(loadedSample);
                setPatients(loadedPatients);
                setTests(loadedTests);

                const currentPatient = loadedSample.patient?._id;

                const currentTest = loadedSample.test?._id;

                // Current patient may be inactive.
                if (
                    loadedSample.patient &&
                    !loadedPatients.some((patient) => patient._id === currentPatient)
                ) {
                    loadedPatients.push(loadedSample.patient);
                    setPatients([...loadedPatients]);
                }

                // Current test may be inactive.
                if (loadedSample.test && !loadedTests.some((test) => test._id === currentTest)) {
                    loadedTests.push(loadedSample.test);
                    setTests([...loadedTests]);
                }

                setFormData({
                    patient: loadedSample.patient?._id || '',
                    test: loadedSample.test?._id || '',
                    sampleType: loadedSample.sampleType || loadedSample.test?.sampleType || '',
                    specimenSite:
                        loadedSample.specimenSite || loadedSample.test?.specimenSite || '',
                    collectionDateTime: toDateTimeLocal(loadedSample.collectionDateTime),
                    collectedBy: loadedSample.collectedBy || '',
                    receivedDateTime: toDateTimeLocal(loadedSample.receivedDateTime),
                    receivedBy: loadedSample.receivedBy || '',
                    status: loadedSample.status || 'PENDING',
                    rejectionReason: loadedSample.rejectionReason || '',
                    remarks: loadedSample.remarks || '',
                });
            } catch {
                setError('Unable to connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [sampleId, router]);

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: undefined,
        }));
    };

    const handleTestChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const selectedTestId = event.target.value;

        const selectedTest = tests.find((test) => test._id === selectedTestId);

        setFormData((previous) => ({
            ...previous,
            test: selectedTestId,
            sampleType: selectedTest?.sampleType || '',
            specimenSite: selectedTest?.specimenSite || '',
        }));

        setErrors((previous) => ({
            ...previous,
            test: undefined,
            sampleType: undefined,
            specimenSite: undefined,
        }));
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};

        if (!formData.patient) {
            newErrors.patient = 'Patient is required.';
        }

        if (!formData.test) {
            newErrors.test = 'Test is required.';
        }

        if (formData.status === 'REJECTED' && !formData.rejectionReason.trim()) {
            newErrors.rejectionReason = 'Rejection reason is required when status is Rejected.';
        }

        if (formData.rejectionReason.length > 500) {
            newErrors.rejectionReason = 'Rejection reason cannot exceed 500 characters.';
        }

        if (formData.collectedBy.length > 100) {
            newErrors.collectedBy = 'Collected by cannot exceed 100 characters.';
        }

        if (formData.receivedBy.length > 100) {
            newErrors.receivedBy = 'Received by cannot exceed 100 characters.';
        }

        if (formData.sampleType.length > 100) {
            newErrors.sampleType = 'Sample type cannot exceed 100 characters.';
        }

        if (formData.specimenSite.length > 150) {
            newErrors.specimenSite = 'Specimen/site cannot exceed 150 characters.';
        }

        if (formData.remarks.length > 1000) {
            newErrors.remarks = 'Remarks cannot exceed 1000 characters.';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            setError('');

            const response = await fetch(`/api/lab-samples/${sampleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    patient: formData.patient,
                    test: formData.test,
                    sampleType: formData.sampleType.trim(),
                    specimenSite: formData.specimenSite.trim(),
                    collectionDateTime: formData.collectionDateTime,
                    collectedBy: formData.collectedBy.trim(),
                    receivedDateTime: formData.receivedDateTime,
                    receivedBy: formData.receivedBy.trim(),
                    status: formData.status,
                    rejectionReason:
                        formData.status === 'REJECTED' ? formData.rejectionReason.trim() : '',
                    remarks: formData.remarks.trim(),
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                router.replace('/login');
                return;
            }

            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                }

                setError(data.message || 'Failed to update lab sample.');

                return;
            }

            router.push(`/lab-samples/${sampleId}`);
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

    if (error && !sample) {
        return (
            <div>
                <div className="mb-6">
                    <Link
                        href={`/lab-samples/${sampleId}`}
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Lab Sample
                    </Link>
                </div>

                <Alert variant="danger">
                    <div className="text-sm">
                        <p className="font-semibold">Unable to load lab sample</p>

                        <p className="mt-1">{error}</p>
                    </div>
                </Alert>
            </div>
        );
    }

    if (!sample) {
        return null;
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={`/lab-samples/${sampleId}`}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Lab Sample
                </Link>

                <h1 className="mt-3 text-2xl font-bold text-[var(--color-text)]">
                    Edit Lab Sample
                </h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Update sample information and collection details for{' '}
                    <span className="font-medium">{sample.sampleId}</span>.
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
                {/* Basic Information */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Basic Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update the patient and test information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
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
                                placeholder="e.g. Blood, Urine"
                                disabled={saving}
                            />

                            {errors.sampleType && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.sampleType}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="specimenSite"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Specimen / Site
                            </label>

                            <Input
                                id="specimenSite"
                                name="specimenSite"
                                value={formData.specimenSite}
                                onChange={handleChange}
                                placeholder="e.g. Left arm, Urine"
                                disabled={saving}
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
                            Collection Details
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update sample collection information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
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
                        </div>

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
                                placeholder="Enter collector name"
                                disabled={saving}
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
                            Receiving Details
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update sample receiving information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
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
                        </div>

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
                                placeholder="Enter receiver name"
                                disabled={saving}
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
                            Update the current sample workflow status.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
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
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {formatStatus(status)}
                                    </option>
                                ))}
                            </Select>

                            {errors.status && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        {formData.status === 'REJECTED' && (
                            <div>
                                <label
                                    htmlFor="rejectionReason"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Rejection Reason
                                    <span className="ml-1 text-[var(--color-danger)]">*</span>
                                </label>

                                <Textarea
                                    id="rejectionReason"
                                    name="rejectionReason"
                                    value={formData.rejectionReason}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Enter reason for rejecting this sample"
                                    disabled={saving}
                                />

                                {errors.rejectionReason && (
                                    <p className="mt-1 text-xs text-[var(--color-danger)]">
                                        {errors.rejectionReason}
                                    </p>
                                )}
                            </div>
                        )}
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
                            value={formData.remarks}
                            onChange={handleChange}
                            rows={5}
                            placeholder="Enter any additional remarks..."
                            disabled={saving}
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
                    <Link href={`/lab-samples/${sampleId}`}>
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
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}