'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

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
    referralType: 'INDIVIDUAL' | 'HOSPITAL' | 'CLINIC' | 'OTHER';
    status: 'ACTIVE' | 'INACTIVE';
}

const referralTypeLabels: Record<Doctor['referralType'], string> = {
    INDIVIDUAL: 'Individual Doctor',
    HOSPITAL: 'Hospital',
    CLINIC: 'Clinic',
    OTHER: 'Other',
};

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams();

            if (search.trim()) {
                params.set('search', search.trim());
            }

            if (status) {
                params.set('status', status);
            }

            const response = await fetch(`/api/doctors?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to fetch doctors');
                return;
            }

            setDoctors(data.doctors || []);
        } catch {
            setError('Something went wrong while fetching doctors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [status]);

    const handleSearch = () => {
        fetchDoctors();
    };

    const handleClear = () => {
        setSearch('');
        setStatus('');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        Doctors / Referrals
                    </h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Manage doctors, hospitals, clinics and referral sources.
                    </p>
                </div>

                <Link href="/doctors/new">
                    <Button>+ Add Doctor / Referral</Button>
                </Link>
            </div>

            {/* Search & Filter */}
            <Card>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto_auto]">
                    <Input
                        type="text"
                        placeholder="Search by ID, name, mobile, registration..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                    />

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>

                    <Button type="button" onClick={handleSearch}>
                        Search
                    </Button>

                    <Button type="button" variant="secondary" onClick={handleClear}>
                        Clear
                    </Button>
                </div>
            </Card>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Table */}
            <Card className="overflow-hidden p-0">
                {loading ? (
                    <div className="flex min-h-48 items-center justify-center">
                        <p className="text-sm text-[var(--color-text-muted)]">Loading doctors...</p>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                        <p className="text-base font-medium text-[var(--color-text)]">
                            No doctors or referrals found
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Add a doctor or referral source to get started.
                        </p>

                        <Link href="/doctors/new" className="mt-4">
                            <Button>+ Add Doctor / Referral</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="border-b border-[var(--color-border)] bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Doctor ID
                                    </th>

                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Name
                                    </th>

                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Specialization
                                    </th>

                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Referral Type
                                    </th>

                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Mobile
                                    </th>

                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        City
                                    </th>

                                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Status
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--color-border)]">
                                {doctors.map((doctor) => (
                                    <tr key={doctor._id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[var(--color-primary)]">
                                            {doctor.doctorId}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-[var(--color-text)]">
                                                {doctor.name}
                                            </div>

                                            {doctor.qualification && (
                                                <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                    {doctor.qualification}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                            {doctor.specialization || '—'}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                            {referralTypeLabels[doctor.referralType]}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                            {doctor.mobileNumber || '—'}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                            {doctor.city || '—'}
                                        </td>

                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={
                                                    doctor.status === 'ACTIVE'
                                                        ? 'success'
                                                        : 'danger'
                                                }
                                            >
                                                {doctor.status}
                                            </Badge>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/doctors/${doctor._id}`}
                                                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
