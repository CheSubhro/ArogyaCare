'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';

interface Patient {
    _id: string;
    patientId: string;
    name: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    age?: number;
    mobileNumber: string;
    email?: string;
    city?: string;
    bloodGroup?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadPatients = async (searchValue = '') => {
        try {
            setLoading(true);
            setError('');

            const query = searchValue.trim()
                ? `?search=${encodeURIComponent(searchValue.trim())}`
                : '';

            const response = await fetch(`/api/patients${query}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                setError(data.message || 'Unable to load patients.');

                return;
            }

            setPatients(data.patients || []);
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await loadPatients(search);
    };

    const handleClearSearch = async () => {
        setSearch('');

        await loadPatients('');
    };

    const formatDate = (date: string) => {
        if (!date) {
            return '—';
        }

        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
        }).format(new Date(date));
    };

    const formatGender = (gender: Patient['gender']) => {
        switch (gender) {
            case 'MALE':
                return 'Male';

            case 'FEMALE':
                return 'Female';

            default:
                return 'Other';
        }
    };

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Patients</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Manage patient records and information.
                    </p>
                </div>

                <Link href="/patients/new">
                    <Button type="button">+ Add Patient</Button>
                </Link>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6">
                    <Alert variant="danger">{error}</Alert>
                </div>
            )}

            {/* Search */}
            <Card className="mb-6">
                <form onSubmit={handleSearch} className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex-1">
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by Patient ID, name or mobile number"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit">Search</Button>

                            <Button type="button" variant="secondary" onClick={handleClearSearch}>
                                Clear
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>

            {/* Patient List */}
            <Card>
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Patient List
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            {patients.length} patient
                            {patients.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-64 items-center justify-center">
                        <Spinner />
                    </div>
                ) : patients.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                            👤
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-[var(--color-text)]">
                            No patients found
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
                            No patient records are available. Add a new patient to get started.
                        </p>

                        <div className="mt-4">
                            <Link href="/patients/new">
                                <Button type="button">+ Add Patient</Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--color-border)]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Patient ID
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Patient
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Gender / Age
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Mobile
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Blood Group
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Status
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Created
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--color-border)] bg-white">
                                {patients.map((patient) => (
                                    <tr key={patient._id} className="hover:bg-slate-50">
                                        {/* Patient ID */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="text-sm font-semibold text-[var(--color-primary)]">
                                                {patient.patientId}
                                            </span>
                                        </td>

                                        {/* Patient */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                                    {patient.name}
                                                </p>

                                                {patient.email && (
                                                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                        {patient.email}
                                                    </p>
                                                )}

                                                {patient.city && (
                                                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                        {patient.city}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Gender / Age */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <p className="text-sm text-[var(--color-text)]">
                                                {formatGender(patient.gender)}
                                            </p>

                                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                                {patient.age !== undefined
                                                    ? `${patient.age} years`
                                                    : 'Age not provided'}
                                            </p>
                                        </td>

                                        {/* Mobile */}
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text)]">
                                            {patient.mobileNumber}
                                        </td>

                                        {/* Blood Group */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="text-sm font-medium text-[var(--color-text)]">
                                                {patient.bloodGroup || 'UNKNOWN'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {patient.status === 'ACTIVE' ? (
                                                <Badge variant="success">Active</Badge>
                                            ) : (
                                                <Badge variant="warning">Inactive</Badge>
                                            )}
                                        </td>

                                        {/* Created */}
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-muted)]">
                                            {formatDate(patient.createdAt)}
                                        </td>

                                        {/* Action */}
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <Link
                                                href={`/patients/${patient._id}`}
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
