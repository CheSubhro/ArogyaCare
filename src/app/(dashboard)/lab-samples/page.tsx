'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

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
    status: 'PENDING' | 'COLLECTED' | 'RECEIVED' | 'REJECTED' | 'PROCESSED' | 'CANCELLED';
    rejectionReason?: string;
    remarks?: string;
    createdAt: string;
    updatedAt: string;
}

const statusOptions = [
    {
        value: '',
        label: 'All Status',
    },
    {
        value: 'PENDING',
        label: 'Pending',
    },
    {
        value: 'COLLECTED',
        label: 'Collected',
    },
    {
        value: 'RECEIVED',
        label: 'Received',
    },
    {
        value: 'REJECTED',
        label: 'Rejected',
    },
    {
        value: 'PROCESSED',
        label: 'Processed',
    },
    {
        value: 'CANCELLED',
        label: 'Cancelled',
    },
];

function formatStatus(status: LabSample['status']) {
    switch (status) {
        case 'PENDING':
            return 'Pending';

        case 'COLLECTED':
            return 'Collected';

        case 'RECEIVED':
            return 'Received';

        case 'REJECTED':
            return 'Rejected';

        case 'PROCESSED':
            return 'Processed';

        case 'CANCELLED':
            return 'Cancelled';

        default:
            return status;
    }
}

function getStatusClass(status: LabSample['status']) {
    switch (status) {
        case 'PENDING':
            return 'bg-amber-50 text-amber-700';

        case 'COLLECTED':
            return 'bg-blue-50 text-blue-700';

        case 'RECEIVED':
            return 'bg-indigo-50 text-indigo-700';

        case 'REJECTED':
            return 'bg-red-50 text-red-700';

        case 'PROCESSED':
            return 'bg-green-50 text-green-700';

        case 'CANCELLED':
            return 'bg-slate-100 text-slate-600';

        default:
            return 'bg-slate-100 text-slate-600';
    }
}

function formatDateTime(value?: string) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function LabSamplesPage() {
    const router = useRouter();

    const [samples, setSamples] = useState<LabSample[]>([]);

    const [search, setSearch] = useState('');

    const [status, setStatus] = useState('');

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [page, setPage] = useState(1);

    const [totalPages, setTotalPages] = useState(1);

    const [total, setTotal] = useState(0);

    const loadSamples = async () => {
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

            params.set('page', String(page));

            params.set('limit', '20');

            const response = await fetch(`/api/lab-samples?${params.toString()}`, {
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

                setError(data.message || 'Unable to load lab samples.');

                return;
            }

            setSamples(data.samples || []);

            setTotal(data.pagination?.total || 0);

            setTotalPages(data.pagination?.totalPages || 1);
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSamples();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, status]);

    const handleSearch = () => {
        setPage(1);
        loadSamples();
    };

    const handleClear = () => {
        setSearch('');
        setStatus('');
        setPage(1);
    };

    return (
        <div>
            {/* Header */}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Lab Samples</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Manage sample collection, receiving and processing.
                    </p>
                </div>

                <Link href="/lab-samples/new">
                    <Button className="w-full sm:w-auto">+ Add Sample</Button>
                </Link>
            </div>

            {/* Filters */}

            <Card className="mb-6">
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Search */}

                    <div className="lg:col-span-2">
                        <label
                            htmlFor="search"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Search Sample
                        </label>

                        <div className="flex gap-2">
                            <input
                                id="search"
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Search by Sample ID"
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                            />

                            <Button type="button" onClick={handleSearch}>
                                Search
                            </Button>
                        </div>
                    </div>

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
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Clear */}

                    <div className="flex items-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClear}
                            className="w-full"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Error */}

            {error && (
                <div className="mb-6">
                    <Alert variant="danger">{error}</Alert>
                </div>
            )}

            {/* Table */}

            <Card>
                <div className="border-b border-[var(--color-border)] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Sample Records
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                {total} sample
                                {total !== 1 ? 's' : ''} found
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-64 items-center justify-center">
                        <Spinner />
                    </div>
                ) : samples.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            No lab samples found.
                        </p>

                        <Link
                            href="/lab-samples/new"
                            className="mt-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                        >
                            Create the first sample
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--color-border)]">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Sample
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Patient
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Test
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Sample Type
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Collection
                                        </th>

                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Status
                                        </th>

                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--color-border)] bg-white">
                                    {samples.map((sample) => (
                                        <tr key={sample._id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="font-medium text-[var(--color-text)]">
                                                    {sample.sampleId}
                                                </div>

                                                <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                                    {sample._id}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-medium text-[var(--color-text)]">
                                                    {sample.patient?.name}
                                                </div>

                                                <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                                    {sample.patient?.patientId}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-medium text-[var(--color-text)]">
                                                    {sample.test?.name}
                                                </div>

                                                <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                                    {sample.test?.code}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-sm text-[var(--color-text-muted)]">
                                                {sample.sampleType || '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--color-text-muted)]">
                                                {formatDateTime(sample.collectionDateTime)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                                        sample.status,
                                                    )}`}
                                                >
                                                    {formatStatus(sample.status)}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-right">
                                                <Link
                                                    href={`/lab-samples/${sample._id}`}
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

                        {/* Pagination */}

                        {totalPages > 1 && (
                            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Page {page} of {totalPages}
                                </p>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={page === 1}
                                        onClick={() =>
                                            setPage((current) => Math.max(1, current - 1))
                                        }
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={page >= totalPages}
                                        onClick={() =>
                                            setPage((current) => Math.min(totalPages, current + 1))
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}