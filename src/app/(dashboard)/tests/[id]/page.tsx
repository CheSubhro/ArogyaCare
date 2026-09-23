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

interface TestCategory {
    _id: string;
    name: string;
    code: string;
    department?: string;
    modality?: string;
}

interface Test {
    _id: string;
    name: string;
    code: string;
    category: TestCategory;
    department?: string;
    testType: 'LABORATORY' | 'IMAGING' | 'CARDIOLOGY' | 'NEUROLOGY' | 'PROCEDURE' | 'OTHER';
    sampleType?: string;
    specimenSite?: string;
    modality?: string;
    preparationRequired: boolean;
    preparationInstructions?: string;
    turnaroundTime?: number;
    turnaroundUnit: 'MINUTES' | 'HOURS' | 'DAYS';
    price: number;
    discountAllowed: boolean;
    reportType: 'NUMERIC' | 'TEXT' | 'STRUCTURED' | 'IMAGING' | 'MIXED';
    displayOrder: number;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

export default function ViewTestPage() {
    const params = useParams();

    const router = useRouter();

    const testId = params.id as string;

    const [test, setTest] = useState<Test | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [statusError, setStatusError] = useState('');

    const [statusUpdating, setStatusUpdating] = useState(false);

    const [showStatusModal, setShowStatusModal] = useState(false);

    const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'INACTIVE' | null>(null);

    useEffect(() => {
        if (!testId) {
            return;
        }

        const loadTest = async () => {
            try {
                setLoading(true);

                setError('');

                const response = await fetch(`/api/tests/${testId}`, {
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
                    setError(data.message || 'Unable to load test details.');
                    return;
                }

                setTest(data.test);
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadTest();
    }, [testId, router]);

    const formatDateTime = (date?: string) => {
        if (!date) {
            return '—';
        }

        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(date));
    };

    const formatTestType = (testType?: Test['testType']) => {
        switch (testType) {
            case 'LABORATORY':
                return 'Laboratory';

            case 'IMAGING':
                return 'Imaging';

            case 'CARDIOLOGY':
                return 'Cardiology';

            case 'NEUROLOGY':
                return 'Neurology';

            case 'PROCEDURE':
                return 'Procedure';

            case 'OTHER':
                return 'Other';

            default:
                return '—';
        }
    };

    const formatReportType = (reportType?: Test['reportType']) => {
        switch (reportType) {
            case 'NUMERIC':
                return 'Numeric';

            case 'TEXT':
                return 'Text';

            case 'STRUCTURED':
                return 'Structured';

            case 'IMAGING':
                return 'Imaging';

            case 'MIXED':
                return 'Mixed';

            default:
                return '—';
        }
    };

    const formatTurnaround = () => {
        if (test?.turnaroundTime === undefined || test.turnaroundTime === null) {
            return 'Not specified';
        }

        let unit = '';

        switch (test.turnaroundUnit) {
            case 'MINUTES':
                unit = test.turnaroundTime === 1 ? 'minute' : 'minutes';
                break;

            case 'HOURS':
                unit = test.turnaroundTime === 1 ? 'hour' : 'hours';
                break;

            case 'DAYS':
                unit = test.turnaroundTime === 1 ? 'day' : 'days';
                break;
        }

        return `${test.turnaroundTime} ${unit}`;
    };

    const formatPrice = (price?: number) => {
        if (price === undefined || price === null) {
            return '—';
        }

        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(price);
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
        if (!test || !pendingStatus) {
            return;
        }

        try {
            setStatusUpdating(true);

            setStatusError('');

            const response = await fetch(`/api/tests/${testId}`, {
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
                setStatusError(data.message || 'Unable to update test status.');
                return;
            }

            setTest((previous) =>
                previous
                    ? {
                          ...previous,
                          status: data.test.status,
                          updatedAt: data.test.updatedAt || previous.updatedAt,
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
                        href="/tests"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Tests
                    </Link>
                </div>

                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    if (!test) {
        return (
            <div className="space-y-4">
                <Link
                    href="/tests"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Tests
                </Link>

                <Alert variant="warning">Test record not found.</Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/tests"
                        className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Tests
                    </Link>

                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Test Details</h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Test Code:{' '}
                        <span className="font-semibold text-[var(--color-primary)]">
                            {test.code}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => router.push('/tests')}>
                        Back
                    </Button>

                    <Link href={`/tests/${test._id}/edit`}>
                        <Button type="button">Edit Test</Button>
                    </Link>
                </div>
            </div>

            {/* Test Status */}

            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-[var(--color-text)]">
                            Test Status
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Control whether this test is currently active.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={test.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {test.status}
                        </Badge>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                handleStatusChange(test.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                            }
                            disabled={statusUpdating}
                        >
                            {statusUpdating ? (
                                <span className="flex items-center gap-2">
                                    <Spinner size="sm" />
                                    Updating...
                                </span>
                            ) : test.status === 'ACTIVE' ? (
                                'Deactivate Test'
                            ) : (
                                'Activate Test'
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

            {/* Basic Information */}

            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Basic Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Basic information about the diagnostic test.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Test Code
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                            {test.code}
                        </p>
                    </div>

                    <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Test Name
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                            {test.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Test Type
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatTestType(test.testType)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Department
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {test.department || 'Not provided'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Modality
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {test.modality || 'Not provided'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Category Information */}

            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Category Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Test category and classification details.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Category Name
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                            {test.category?.name || 'Not provided'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Category Code
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                            {test.category?.code || 'Not provided'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Category Department
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {test.category?.department || 'Not provided'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Sample / Procedure Information */}

            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Sample / Procedure Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Sample, specimen, or procedure site information.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Sample Type
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {test.sampleType || 'Not provided'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Specimen / Body Site
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {test.specimenSite || 'Not provided'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Preparation Information */}

            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Preparation Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Patient preparation requirements before the test.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Preparation Required
                        </p>

                        <div className="mt-2">
                            {test.preparationRequired ? (
                                <Badge variant="warning">Required</Badge>
                            ) : (
                                <Badge variant="success">Not Required</Badge>
                            )}
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Preparation Instructions
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text)]">
                            {test.preparationInstructions || 'No preparation instructions provided'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Reporting & Turnaround */}

            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Reporting & Turnaround
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Report format and expected turnaround information.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Report Type
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                            {formatReportType(test.reportType)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Turnaround Time
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatTurnaround()}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Display Order
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">{test.displayOrder}</p>
                    </div>
                </div>
            </Card>

            {/* Pricing */}

            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Pricing</h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Test pricing and discount configuration.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Test Price
                        </p>

                        <p className="mt-1 text-lg font-semibold text-[var(--color-primary)]">
                            {formatPrice(test.price)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Discount Allowed
                        </p>

                        <div className="mt-2">
                            {test.discountAllowed ? (
                                <Badge variant="success">Yes</Badge>
                            ) : (
                                <Badge variant="warning">No</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Description */}

            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Description</h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Additional information about this test.
                    </p>
                </div>

                <div className="pt-6">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                        {test.description || 'No description provided.'}
                    </p>
                </div>
            </Card>

            {/* Record Information */}

            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Record Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Test record timestamps and status.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Status
                        </p>

                        <div className="mt-2">
                            {test.status === 'ACTIVE' ? (
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
                            {formatDateTime(test.createdAt)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Last Updated
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDateTime(test.updatedAt)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Status Confirmation Modal */}

            <Modal
                open={showStatusModal}
                onClose={closeStatusModal}
                title={pendingStatus === 'INACTIVE' ? 'Deactivate Test' : 'Activate Test'}
            >
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                        {pendingStatus === 'INACTIVE'
                            ? `Are you sure you want to deactivate ${test.name}? The test record will be retained, but the test will be marked as inactive.`
                            : `Are you sure you want to activate ${test.name}?`}
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