'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

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
    price?: number;
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
    createdAt: string;
    updatedAt: string;
}

const statusOptions: LabSampleStatus[] = [
    'PENDING',
    'COLLECTED',
    'RECEIVED',
    'REJECTED',
    'PROCESSED',
    'CANCELLED',
];

function formatDateTime(value?: string) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(value?: string) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function getStatusVariant(
    status: LabSampleStatus,
): 'success' | 'warning' | 'danger' | 'info' | 'default' {
    switch (status) {
        case 'PROCESSED':
            return 'success';

        case 'COLLECTED':
        case 'RECEIVED':
            return 'info';

        case 'REJECTED':
        case 'CANCELLED':
            return 'danger';

        case 'PENDING':
            return 'warning';

        default:
            return 'default';
    }
}

function formatStatus(status: LabSampleStatus) {
    return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function LabSampleDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const sampleId = params.id as string;

    const [sample, setSample] = useState<LabSample | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<LabSampleStatus>('PENDING');
    const [rejectionReason, setRejectionReason] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusError, setStatusError] = useState('');

    useEffect(() => {
        if (!sampleId) {
            return;
        }

        const fetchSample = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`/api/lab-samples/${sampleId}`, {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        router.replace('/login');
                        return;
                    }

                    setError(data.message || 'Failed to load lab sample.');

                    return;
                }

                setSample(data.sample);
            } catch {
                setError('Unable to connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchSample();
    }, [sampleId, router]);

    const openStatusModal = () => {
        if (!sample) {
            return;
        }

        setNewStatus(sample.status);
        setRejectionReason(sample.rejectionReason || '');
        setStatusError('');
        setStatusModalOpen(true);
    };

    const handleStatusUpdate = async () => {
        if (!sample) {
            return;
        }

        if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
            setStatusError('Rejection reason is required.');

            return;
        }

        try {
            setUpdatingStatus(true);
            setStatusError('');

            const response = await fetch(`/api/lab-samples/${sample._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: newStatus,
                    rejectionReason: newStatus === 'REJECTED' ? rejectionReason.trim() : '',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    router.replace('/login');
                    return;
                }

                setStatusError(data.message || 'Failed to update status.');

                return;
            }

            setSample(data.sample);
            setStatusModalOpen(false);
        } catch {
            setStatusError('Unable to connect to the server.');
        } finally {
            setUpdatingStatus(false);
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
            <div>
                <div className="mb-6">
                    <Link
                        href="/lab-samples"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Lab Samples
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
                    href="/lab-samples"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Lab Samples
                </Link>

                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-[var(--color-text)]">
                                {sample.sampleId}
                            </h1>

                            <Badge variant={getStatusVariant(sample.status)}>
                                {formatStatus(sample.status)}
                            </Badge>
                        </div>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Lab sample details and collection information.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={openStatusModal}
                            className="w-full sm:w-auto"
                        >
                            Update Status
                        </Button>

                        <Link href={`/lab-samples/${sample._id}/edit`} className="w-full sm:w-auto">
                            <Button type="button" className="w-full sm:w-auto">
                                Edit Sample
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Patient Information */}
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Patient Information
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem label="Patient ID" value={sample.patient?.patientId || '—'} />

                    <InfoItem label="Patient Name" value={sample.patient?.name || '—'} />

                    <InfoItem label="Gender" value={sample.patient?.gender || '—'} />

                    <InfoItem label="Mobile" value={sample.patient?.mobile || '—'} />
                </div>

                {sample.patient?._id && (
                    <div className="border-t border-[var(--color-border)] px-6 py-4">
                        <Link
                            href={`/patients/${sample.patient._id}`}
                            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                        >
                            View Patient Details →
                        </Link>
                    </div>
                )}
            </Card>

            {/* Test Information */}
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Test Information
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem label="Test Name" value={sample.test?.name || '—'} />

                    <InfoItem label="Test Code" value={sample.test?.code || '—'} />

                    <InfoItem label="Department" value={sample.test?.department || '—'} />

                    <InfoItem label="Test Type" value={sample.test?.testType || '—'} />

                    <InfoItem label="Sample Type" value={sample.test?.sampleType || '—'} />

                    <InfoItem label="Specimen / Site" value={sample.test?.specimenSite || '—'} />

                    <InfoItem label="Modality" value={sample.test?.modality || '—'} />

                    <InfoItem
                        label="Price"
                        value={
                            typeof sample.test?.price === 'number'
                                ? `₹${sample.test.price.toFixed(2)}`
                                : '—'
                        }
                    />
                </div>

                {sample.test?._id && (
                    <div className="border-t border-[var(--color-border)] px-6 py-4">
                        <Link
                            href={`/tests/${sample.test._id}`}
                            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                        >
                            View Test Details →
                        </Link>
                    </div>
                )}
            </Card>

            {/* Sample Information */}
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Sample Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Sample and specimen details.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem label="Sample ID" value={sample.sampleId} />

                    <InfoItem label="Sample Type" value={sample.sampleType || '—'} />

                    <InfoItem label="Specimen / Site" value={sample.specimenSite || '—'} />
                </div>
            </Card>

            {/* Collection & Receiving */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Collection Details
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6">
                        <InfoItem
                            label="Collection Date & Time"
                            value={formatDateTime(sample.collectionDateTime)}
                        />

                        <InfoItem label="Collected By" value={sample.collectedBy || '—'} />
                    </div>
                </Card>

                <Card>
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Receiving Details
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6">
                        <InfoItem
                            label="Received Date & Time"
                            value={formatDateTime(sample.receivedDateTime)}
                        />

                        <InfoItem label="Received By" value={sample.receivedBy || '—'} />
                    </div>
                </Card>
            </div>

            {/* Rejection Information */}
            {sample.status === 'REJECTED' && (
                <Card className="mt-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Rejection Information
                        </h2>
                    </div>

                    <div className="p-6">
                        <InfoItem label="Rejection Reason" value={sample.rejectionReason || '—'} />
                    </div>
                </Card>
            )}

            {/* Remarks */}
            <Card className="mt-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Remarks</h2>
                </div>

                <div className="p-6">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                        {sample.remarks || 'No remarks added.'}
                    </p>
                </div>
            </Card>

            {/* Record Information */}
            <Card className="mt-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Record Information
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem label="Created" value={formatDate(sample.createdAt)} />

                    <InfoItem label="Last Updated" value={formatDate(sample.updatedAt)} />

                    <InfoItem label="Current Status" value={formatStatus(sample.status)} />
                </div>
            </Card>

            {/* Status Modal */}
            <Modal
                open={statusModalOpen}
                onClose={() => {
                    if (!updatingStatus) {
                        setStatusModalOpen(false);
                    }
                }}
                title="Update Sample Status"
            >
                <div className="space-y-5">
                    {statusError && (
                        <Alert variant="danger">
                            <p className="text-sm">{statusError}</p>
                        </Alert>
                    )}

                    <div>
                        <label
                            htmlFor="sample-status"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Status
                        </label>

                        <Select
                            id="sample-status"
                            value={newStatus}
                            onChange={(event) =>
                                setNewStatus(event.target.value as LabSampleStatus)
                            }
                            disabled={updatingStatus}
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {formatStatus(status)}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {newStatus === 'REJECTED' && (
                        <div>
                            <label
                                htmlFor="rejection-reason"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Rejection Reason
                            </label>

                            <textarea
                                id="rejection-reason"
                                value={rejectionReason}
                                onChange={(event) => setRejectionReason(event.target.value)}
                                disabled={updatingStatus}
                                rows={4}
                                placeholder="Enter reason for rejecting this sample"
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
                            />
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setStatusModalOpen(false)}
                            disabled={updatingStatus}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={handleStatusUpdate}
                            disabled={updatingStatus}
                            className="w-full sm:w-auto"
                        >
                            {updatingStatus ? 'Updating...' : 'Update Status'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {label}
            </p>

            <p className="mt-1.5 text-sm font-medium text-[var(--color-text)]">{value}</p>
        </div>
    );
}