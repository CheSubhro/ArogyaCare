'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

interface Patient {
    _id: string;
    patientId: string;
    name: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: string;
    age?: number;
    mobileNumber: string;
    email?: string;
    address?: string;
    city?: string;
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

export default function ViewPatientPage() {
    const params = useParams();
    const router = useRouter();

    const patientId = params.id as string;

    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');
    const [statusError, setStatusError] = useState('');

    const [statusUpdating, setStatusUpdating] = useState(false);

    const [showStatusModal, setShowStatusModal] = useState(false);

    const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'INACTIVE' | null>(null);

    useEffect(() => {
        if (!patientId) {
            return;
        }

        const loadPatient = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`/api/patients/${patientId}`, {
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
                    setError(data.message || 'Unable to load patient details.');
                    return;
                }

                setPatient(data.patient);
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadPatient();
    }, [patientId, router]);

    const formatDate = (date?: string) => {
        if (!date) {
            return '—';
        }

        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
        }).format(new Date(date));
    };

    const formatDateTime = (date?: string) => {
        if (!date) {
            return '—';
        }

        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(date));
    };

    const formatGender = (gender?: Patient['gender']) => {
        switch (gender) {
            case 'MALE':
                return 'Male';

            case 'FEMALE':
                return 'Female';

            case 'OTHER':
                return 'Other';

            default:
                return '—';
        }
    };

    const handleStatusChange = (newStatus: 'ACTIVE' | 'INACTIVE') => {
        setStatusError('');
        setPendingStatus(newStatus);
        setShowStatusModal(true);
    };

    const closeStatusModal = () => {
        if (statusUpdating) {
            return;
        }

        setShowStatusModal(false);
        setPendingStatus(null);
    };

    const confirmStatusChange = async () => {
        if (!patient || !pendingStatus) {
            return;
        }

        try {
            setStatusUpdating(true);
            setStatusError('');

            const response = await fetch(`/api/patients/${patientId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: pendingStatus,
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                router.replace('/login');
                return;
            }

            if (!response.ok) {
                setStatusError(data.message || 'Unable to update patient status.');
                return;
            }

            setPatient((previous) =>
                previous
                    ? {
                          ...previous,
                          status: data.patient.status,
                          updatedAt: data.patient.updatedAt || previous.updatedAt,
                      }
                    : previous,
            );

            setShowStatusModal(false);
            setPendingStatus(null);
        } catch {
            setStatusError('Unable to connect to the server. Please try again.');
        } finally {
            setStatusUpdating(false);
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
                <div>
                    <Link
                        href="/patients"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Patients
                    </Link>
                </div>

                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="space-y-4">
                <Link
                    href="/patients"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Patients
                </Link>

                <Alert variant="warning">Patient record not found.</Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/patients"
                        className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Patients
                    </Link>

                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Patient Details</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Patient ID:{' '}
                        <span className="font-semibold text-[var(--color-primary)]">
                            {patient.patientId}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push('/patients')}
                    >
                        Back
                    </Button>

                    <Link href={`/patients/${patient._id}/edit`}>
                        <Button type="button">Edit Patient</Button>
                    </Link>
                </div>
            </div>

            {/* Patient Status */}
            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-[var(--color-text)]">
                            Patient Status
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Control whether this patient is currently active.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={patient.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {patient.status}
                        </Badge>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                handleStatusChange(
                                    patient.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                )
                            }
                            disabled={statusUpdating}
                        >
                            {statusUpdating ? (
                                <span className="flex items-center gap-2">
                                    <Spinner size="sm" />
                                    Updating...
                                </span>
                            ) : patient.status === 'ACTIVE' ? (
                                'Deactivate Patient'
                            ) : (
                                'Activate Patient'
                            )}
                        </Button>
                    </div>
                </div>

                {statusError && (
                    <div className="mt-4">
                        <Alert variant="danger">{statusError}</Alert>
                    </div>
                )}
            </Card>

            {/* Personal Information */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Personal Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Basic information about the patient.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Patient ID
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                            {patient.patientId}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Full Name
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                            {patient.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Gender
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatGender(patient.gender)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Date of Birth
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDate(patient.dateOfBirth)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Age
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {patient.age !== undefined ? `${patient.age} years` : 'Not provided'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Blood Group
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                            {patient.bloodGroup || 'UNKNOWN'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Mobile Number
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {patient.mobileNumber}
                        </p>
                    </div>

                    <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Email
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {patient.email || 'Not provided'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Address Information */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Address Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Patient residential address details.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Address
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text)]">
                            {patient.address || 'Not provided'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            City
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {patient.city || 'Not provided'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Emergency Contact */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Emergency Contact
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Emergency contact information.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Contact Name
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {patient.emergencyContactName || 'Not provided'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Contact Number
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {patient.emergencyContactNumber || 'Not provided'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Record Information */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Record Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Patient record timestamps and status.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Status
                        </p>

                        <div className="mt-2">
                            {patient.status === 'ACTIVE' ? (
                                <Badge variant="success">Active</Badge>
                            ) : (
                                <Badge variant="warning">Inactive</Badge>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Created At
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDateTime(patient.createdAt)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Last Updated
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDateTime(patient.updatedAt)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Status Confirmation Modal */}
            <Modal
                open={showStatusModal}
                onClose={closeStatusModal}
                title={pendingStatus === 'INACTIVE' ? 'Deactivate Patient' : 'Activate Patient'}
            >
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                        {pendingStatus === 'INACTIVE'
                            ? `Are you sure you want to deactivate ${patient.name}? The patient record will be retained, but the patient will be marked as inactive.`
                            : `Are you sure you want to activate ${patient.name}?`}
                    </p>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={closeStatusModal}
                            disabled={statusUpdating}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant={pendingStatus === 'INACTIVE' ? 'danger' : 'primary'}
                            onClick={confirmStatusChange}
                            loading={statusUpdating}
                        >
                            {pendingStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
