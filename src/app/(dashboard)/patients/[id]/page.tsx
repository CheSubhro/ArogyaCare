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

    const [statusUpdating, setStatusUpdating] = useState(false);

    const [showStatusModal, setShowStatusModal] = useState(false);

    useEffect(() => {
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

                if (!response.ok) {
                    if (response.status === 401) {
                        router.replace('/login');
                        return;
                    }

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

        if (patientId) {
            loadPatient();
        }
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

    const handleStatusChange = async () => {
        if (!patient) {
            return;
        }

        try {
            setStatusUpdating(true);
            setError('');

            const newStatus = patient.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

            const response = await fetch(`/api/patients/${patientId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: newStatus,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    router.replace('/login');
                    return;
                }

                setError(data.message || 'Unable to update patient status.');

                return;
            }

            setPatient((previous) =>
                previous
                    ? {
                          ...previous,
                          status: data.patient.status,
                          updatedAt: data.patient.updatedAt,
                      }
                    : previous,
            );

            setShowStatusModal(false);
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setStatusUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-96 items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="mb-6">
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
            <div>
                <div className="mb-6">
                    <Link
                        href="/patients"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Patients
                    </Link>
                </div>

                <Alert variant="warning">Patient record not found.</Alert>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/patients"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Patients
                    </Link>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">
                            Patient Details
                        </h1>

                        {patient.status === 'ACTIVE' ? (
                            <Badge variant="success">Active</Badge>
                        ) : (
                            <Badge variant="warning">Inactive</Badge>
                        )}
                    </div>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Patient ID:{' '}
                        <span className="font-semibold text-[var(--color-primary)]">
                            {patient.patientId}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link href={`/patients/${patient._id}/edit`}>
                        <Button type="button">Edit Patient</Button>
                    </Link>

                    {patient.status === 'ACTIVE' ? (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowStatusModal(true)}
                        >
                            Deactivate
                        </Button>
                    ) : (
                        <Button type="button" onClick={() => setShowStatusModal(true)}>
                            Activate
                        </Button>
                    )}
                </div>
            </div>

            {/* Personal Information */}
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Personal Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Basic information about the patient.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Address Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Patient residential address details.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
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
            <Card className="mb-6">
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Emergency Contact
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Emergency contact information.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
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
                <div className="border-b border-[var(--color-border)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Record Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Patient record timestamps and status.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
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
            {showStatusModal && patient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-[var(--color-surface)] shadow-xl">
                        <div className="border-b border-[var(--color-border)] px-6 py-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                {patient.status === 'ACTIVE'
                                    ? 'Deactivate Patient'
                                    : 'Activate Patient'}
                            </h2>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                                {patient.status === 'ACTIVE'
                                    ? `Are you sure you want to deactivate ${patient.name}? The patient record will be retained, but the patient will be marked as inactive.`
                                    : `Are you sure you want to activate ${patient.name}?`}
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-6 py-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowStatusModal(false)}
                                disabled={statusUpdating}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                onClick={handleStatusChange}
                                disabled={statusUpdating}
                            >
                                {statusUpdating
                                    ? 'Updating...'
                                    : patient.status === 'ACTIVE'
                                      ? 'Deactivate'
                                      : 'Activate'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
