'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

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
    address?: string;
    city?: string;
    referralType: 'INDIVIDUAL' | 'HOSPITAL' | 'CLINIC' | 'OTHER';
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

const referralTypeLabels: Record<Doctor['referralType'], string> = {
    INDIVIDUAL: 'Individual Doctor',
    HOSPITAL: 'Hospital',
    CLINIC: 'Clinic',
    OTHER: 'Other',
};

function formatDate(dateString?: string) {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function DetailItem({ label, value }: { label: string; value?: string }) {
    return (
        <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {label}
            </p>

            <p className="text-sm font-medium text-[var(--color-text)]">{value || '-'}</p>
        </div>
    );
}

export default function DoctorDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const doctorId = params.id as string;

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!doctorId) return;

        const loadDoctor = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`/api/doctors/${doctorId}`, {
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
                    setError(data.message || 'Failed to load doctor');
                    return;
                }

                setDoctor(data.doctor);
            } catch {
                setError('Unable to load doctor details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadDoctor();
    }, [doctorId, router]);

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
                        href="/doctors"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Doctors / Referrals
                    </Link>
                </div>

                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="space-y-4">
                <Link
                    href="/doctors"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Doctors / Referrals
                </Link>

                <Alert variant="danger">Doctor not found.</Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/doctors"
                        className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Doctors / Referrals
                    </Link>

                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        Doctor / Referral Details
                    </h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        View complete doctor and referral information.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push('/doctors')}
                    >
                        Back
                    </Button>

                    <Link href={`/doctors/${doctor._id}/edit`}>
                        <Button type="button">Edit Doctor</Button>
                    </Link>
                </div>
            </div>

            {/* Basic Information */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Basic Information
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Doctor identification and professional details.
                            </p>
                        </div>

                        <div>
                            <Badge variant={doctor.status === 'ACTIVE' ? 'success' : 'danger'}>
                                {doctor.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem label="Doctor ID" value={doctor.doctorId} />

                    <DetailItem label="Doctor Name" value={doctor.name} />

                    <DetailItem
                        label="Referral Type"
                        value={referralTypeLabels[doctor.referralType]}
                    />

                    <DetailItem label="Qualification" value={doctor.qualification} />

                    <DetailItem label="Specialization" value={doctor.specialization} />

                    <DetailItem label="Registration Number" value={doctor.registrationNumber} />
                </div>
            </Card>

            {/* Contact Information */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Contact Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Doctor contact and associated organization details.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem label="Mobile Number" value={doctor.mobileNumber} />

                    <DetailItem label="Email" value={doctor.email} />

                    <DetailItem label="Clinic Name" value={doctor.clinicName} />

                    <DetailItem label="Hospital Name" value={doctor.hospitalName} />
                </div>
            </Card>

            {/* Address Information */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Address Information
                    </h2>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2">
                    <DetailItem label="Address" value={doctor.address} />

                    <DetailItem label="City" value={doctor.city} />
                </div>
            </Card>

            {/* Record Information */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Record Information
                    </h2>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2">
                    <DetailItem label="Created At" value={formatDate(doctor.createdAt)} />

                    <DetailItem label="Last Updated" value={formatDate(doctor.updatedAt)} />
                </div>
            </Card>
        </div>
    );
}
