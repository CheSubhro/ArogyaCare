'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface DoctorReport {
    _id: string;
    doctorName: string;
    registrationNumber?: string;
    specialization?: string;
    referralType?: string;
    status?: string;
    mobileNumber?: string;
    email?: string;
    clinicName?: string;
    hospitalName?: string;
    totalBills: number;
    totalTests: number;
    totalPatients: number;
}

interface Summary {
    totalReferringDoctors: number;
    totalReferrals: number;
    totalReferredPatients: number;
    totalReferredTests: number;
}

interface ReportResponse {
    success: boolean;
    message?: string;

    summary: Summary;

    referralTypeSummary: Record<string, number>;

    doctors: DoctorReport[];

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

type DatePreset = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'last-month' | 'custom';

const formatDateInput = (date: Date) => {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getDateRange = (preset: DatePreset) => {
    const now = new Date();

    if (preset === 'today') {
        const date = formatDateInput(now);

        return {
            from: date,
            to: date,
        };
    }

    if (preset === 'yesterday') {
        const yesterday = new Date(now);

        yesterday.setDate(yesterday.getDate() - 1);

        const date = formatDateInput(yesterday);

        return {
            from: date,
            to: date,
        };
    }

    if (preset === 'this-week') {
        const day = now.getDay();

        const start = new Date(now);

        start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));

        return {
            from: formatDateInput(start),
            to: formatDateInput(now),
        };
    }

    if (preset === 'last-month') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const end = new Date(now.getFullYear(), now.getMonth(), 0);

        return {
            from: formatDateInput(start),
            to: formatDateInput(end),
        };
    }

    return {
        from: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: formatDateInput(now),
    };
};

const getReferralTypeLabel = (value?: string) => {
    switch (value) {
        case 'INDIVIDUAL':
            return 'Individual Doctor';

        case 'HOSPITAL':
            return 'Hospital';

        case 'CLINIC':
            return 'Clinic';

        default:
            return 'Other';
    }
};

const getReferralTypeVariant = (value?: string) => {
    switch (value) {
        case 'INDIVIDUAL':
            return 'primary' as const;

        case 'HOSPITAL':
            return 'info' as const;

        case 'CLINIC':
            return 'success' as const;

        default:
            return 'default' as const;
    }
};

export default function DoctorReportsPage() {
    const [preset, setPreset] = useState<DatePreset>('this-month');

    const [from, setFrom] = useState('');

    const [to, setTo] = useState('');

    const [search, setSearch] = useState('');

    const [referralType, setReferralType] = useState('');

    const [status, setStatus] = useState('');

    const [data, setData] = useState<ReportResponse | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [page, setPage] = useState(1);

    const limit = 10;

    const loadReport = async (targetPage = page) => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams();

            if (from) {
                params.set('from', from);
            }

            if (to) {
                params.set('to', to);
            }

            if (search.trim()) {
                params.set('search', search.trim());
            }

            if (referralType) {
                params.set('referralType', referralType);
            }

            if (status) {
                params.set('status', status);
            }

            params.set('page', String(targetPage));

            params.set('limit', String(limit));

            const response = await fetch(`/api/reports/doctors?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to load doctor report.');
            }

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load doctor report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const range = getDateRange(preset);

        setFrom(range.from);
        setTo(range.to);
    }, [preset]);

    useEffect(() => {
        if (!from || !to) {
            return;
        }

        loadReport(1);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from, to, search, referralType, status]);

    const handleCustomDateChange = (type: 'from' | 'to', value: string) => {
        setPreset('custom');

        if (type === 'from') {
            setFrom(value);
        } else {
            setTo(value);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--color-text)]">
                        Doctor / Referral Reports
                    </h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        View doctor-wise referrals, patients and test activity.
                    </p>
                </div>

                <Link href="/reports">
                    <Button type="button">Back to Reports</Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {[
                            ['today', 'Today'],
                            ['yesterday', 'Yesterday'],
                            ['this-week', 'This Week'],
                            ['this-month', 'This Month'],
                            ['last-month', 'Last Month'],
                        ].map(([value, label]) => (
                            <Button
                                key={value}
                                type="button"
                                variant={preset === value ? 'primary' : undefined}
                                onClick={() => setPreset(value as DatePreset)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <label className="mb-1 block text-sm font-medium">From</label>

                            <Input
                                type="date"
                                value={from}
                                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">To</label>

                            <Input
                                type="date"
                                value={to}
                                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Search Doctor</label>

                            <Input
                                placeholder="Name, registration or specialization"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Referral Type</label>

                            <Select
                                value={referralType}
                                onChange={(e) => setReferralType(e.target.value)}
                            >
                                <option value="">All Referral Types</option>

                                <option value="INDIVIDUAL">Individual Doctor</option>

                                <option value="HOSPITAL">Hospital</option>

                                <option value="CLINIC">Clinic</option>

                                <option value="OTHER">Other</option>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Status</label>

                            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">All Status</option>

                                <option value="ACTIVE">Active</option>

                                <option value="INACTIVE">Inactive</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </Card>

            {error && (
                <Alert variant="danger">
                    <p className="text-sm">{error}</p>
                </Alert>
            )}

            {/* Loading */}
            {loading && !data ? (
                <div className="flex justify-center py-12">
                    <Spinner />
                </div>
            ) : data ? (
                <>
                    {/* Summary */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Referring Doctors
                            </p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.totalReferringDoctors.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Total Referrals
                            </p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.totalReferrals.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Referred Patients
                            </p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.totalReferredPatients.toLocaleString()}
                            </p>
                        </Card>

                        <Card>
                            <p className="text-sm text-[var(--color-text-muted)]">Referred Tests</p>

                            <p className="mt-2 text-2xl font-semibold">
                                {data.summary.totalReferredTests.toLocaleString()}
                            </p>
                        </Card>
                    </div>

                    {/* Referral Type Summary */}
                    <Card>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Referral Type Summary</h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Number of referring doctors by referral type.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {['INDIVIDUAL', 'HOSPITAL', 'CLINIC', 'OTHER'].map((type) => (
                                <div
                                    key={type}
                                    className="rounded-lg border border-[var(--color-border)] p-4"
                                >
                                    <Badge variant={getReferralTypeVariant(type)} size="sm">
                                        {getReferralTypeLabel(type)}
                                    </Badge>

                                    <p className="mt-3 text-2xl font-semibold">
                                        {(data.referralTypeSummary[type] || 0).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Doctor Table */}
                    <Card>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Doctor-wise Referral Summary</h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Referral activity for the selected period.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--color-border)]">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                        <th className="px-4 py-3">Doctor</th>

                                        <th className="px-4 py-3">Specialization</th>

                                        <th className="px-4 py-3">Referral Type</th>

                                        <th className="px-4 py-3 text-right">Patients</th>

                                        <th className="px-4 py-3 text-right">Referrals</th>

                                        <th className="px-4 py-3 text-right">Tests</th>

                                        <th className="px-4 py-3">Status</th>

                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {data.doctors.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]"
                                            >
                                                No referral activity found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.doctors.map((doctor) => (
                                            <tr key={doctor._id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            {doctor.doctorName}
                                                        </p>

                                                        {doctor.registrationNumber && (
                                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                                {doctor.registrationNumber}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-sm">
                                                    {doctor.specialization || '-'}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={getReferralTypeVariant(
                                                            doctor.referralType,
                                                        )}
                                                        size="sm"
                                                    >
                                                        {getReferralTypeLabel(doctor.referralType)}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3 text-right text-sm font-semibold">
                                                    {doctor.totalPatients.toLocaleString()}
                                                </td>

                                                <td className="px-4 py-3 text-right text-sm font-semibold">
                                                    {doctor.totalBills.toLocaleString()}
                                                </td>

                                                <td className="px-4 py-3 text-right text-sm">
                                                    {doctor.totalTests.toLocaleString()}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            doctor.status === 'ACTIVE'
                                                                ? 'success'
                                                                : 'danger'
                                                        }
                                                        size="sm"
                                                    >
                                                        {doctor.status === 'ACTIVE'
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/doctors/${doctor._id}`}
                                                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data.pagination.totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Page {data.pagination.page} of {data.pagination.totalPages}
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => {
                                            const nextPage = page - 1;

                                            setPage(nextPage);

                                            loadReport(nextPage);
                                        }}
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        type="button"
                                        disabled={page >= data.pagination.totalPages}
                                        onClick={() => {
                                            const nextPage = page + 1;

                                            setPage(nextPage);

                                            loadReport(nextPage);
                                        }}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </>
            ) : null}
        </div>
    );
}
