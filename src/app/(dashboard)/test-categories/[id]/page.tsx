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

interface ParentCategory {
    _id: string;
    name: string;
    code: string;
}

interface TestCategory {
    _id: string;
    name: string;
    code: string;
    description?: string;
    department?: string;
    modality?: string;
    parentCategory?: ParentCategory | null;
    displayOrder: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

export default function ViewTestCategoryPage() {
    const params = useParams();
    const router = useRouter();

    const categoryId = params.id as string;

    const [category, setCategory] = useState<TestCategory | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [statusError, setStatusError] = useState('');

    const [statusUpdating, setStatusUpdating] = useState(false);

    const [showStatusModal, setShowStatusModal] = useState(false);

    const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'INACTIVE' | null>(null);

    useEffect(() => {
        if (!categoryId) {
            return;
        }

        const loadCategory = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`/api/test-categories/${categoryId}`, {
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
                    setError(data.message || 'Unable to load test category details.');
                    return;
                }

                setCategory(data.category);
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadCategory();
    }, [categoryId, router]);

    const formatDateTime = (date?: string) => {
        if (!date) {
            return '—';
        }

        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(date));
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
        if (!category || !pendingStatus) {
            return;
        }

        try {
            setStatusUpdating(true);
            setStatusError('');

            const response = await fetch(`/api/test-categories/${categoryId}`, {
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
                setStatusError(data.message || 'Unable to update test category status.');
                return;
            }

            setCategory((previous) =>
                previous
                    ? {
                          ...previous,
                          status: data.category.status,
                          updatedAt: data.category.updatedAt || previous.updatedAt,
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
                        href="/test-categories"
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Test Categories
                    </Link>
                </div>

                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="space-y-4">
                <Link
                    href="/test-categories"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Test Categories
                </Link>

                <Alert variant="warning">Test category record not found.</Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/test-categories"
                        className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Test Categories
                    </Link>

                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                        Test Category Details
                    </h1>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Category Code:{' '}
                        <span className="font-semibold text-[var(--color-primary)]">
                            {category.code}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push('/test-categories')}
                    >
                        Back
                    </Button>

                    <Link href={`/test-categories/${category._id}/edit`}>
                        <Button type="button">Edit Category</Button>
                    </Link>
                </div>
            </div>

            {/* Category Status */}
            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-[var(--color-text)]">
                            Category Status
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Control whether this test category is currently active.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={category.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {category.status}
                        </Badge>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                handleStatusChange(
                                    category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                )
                            }
                            disabled={statusUpdating}
                        >
                            {statusUpdating ? (
                                <span className="flex items-center gap-2">
                                    <Spinner size="sm" />
                                    Updating...
                                </span>
                            ) : category.status === 'ACTIVE' ? (
                                'Deactivate Category'
                            ) : (
                                'Activate Category'
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
                        Basic information about the diagnostic test category.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Category Name */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Category Name
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                            {category.name}
                        </p>
                    </div>

                    {/* Category Code */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Category Code
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                            {category.code}
                        </p>
                    </div>

                    {/* Department */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Department
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {category.department || 'Not provided'}
                        </p>
                    </div>

                    {/* Modality */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Modality
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {category.modality || 'Not provided'}
                        </p>
                    </div>

                    {/* Parent Category */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Parent Category
                        </p>

                        {category.parentCategory ? (
                            <div className="mt-1">
                                <p className="text-sm font-semibold text-[var(--color-text)]">
                                    {category.parentCategory.name}
                                </p>

                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                    Code: {category.parentCategory.code}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">
                                Root Category
                            </p>
                        )}
                    </div>

                    {/* Display Order */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Display Order
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {category.displayOrder}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Description */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Description</h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Additional information about this test category.
                    </p>
                </div>

                <div className="pt-6">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                        {category.description || 'No description provided.'}
                    </p>
                </div>
            </Card>

            {/* Category Hierarchy */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Category Hierarchy
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Parent-child relationship of this category.
                    </p>
                </div>

                <div className="pt-6">
                    {category.parentCategory ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="rounded-lg border border-[var(--color-border)] bg-slate-50 px-4 py-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Parent
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                                    {category.parentCategory.name}
                                </p>

                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                    {category.parentCategory.code}
                                </p>
                            </div>

                            <span className="text-lg text-[var(--color-text-muted)]">→</span>

                            <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                                    Current Category
                                </p>

                                <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                                    {category.name}
                                </p>

                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                    {category.code}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-[var(--color-border)] bg-slate-50 px-4 py-4">
                            <p className="text-sm font-semibold text-[var(--color-text)]">
                                Root Category
                            </p>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                This category does not have a parent category.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Record Information */}
            <Card>
                <div className="border-b border-[var(--color-border)] pb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Record Information
                    </h2>

                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        Category record timestamps and status.
                    </p>
                </div>

                <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Status */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Status
                        </p>

                        <div className="mt-2">
                            {category.status === 'ACTIVE' ? (
                                <Badge variant="success">Active</Badge>
                            ) : (
                                <Badge variant="warning">Inactive</Badge>
                            )}
                        </div>
                    </div>

                    {/* Created At */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Created At
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDateTime(category.createdAt)}
                        </p>
                    </div>

                    {/* Last Updated */}
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                            Last Updated
                        </p>

                        <p className="mt-1 text-sm text-[var(--color-text)]">
                            {formatDateTime(category.updatedAt)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Status Confirmation Modal */}
            <Modal
                open={showStatusModal}
                onClose={closeStatusModal}
                title={
                    pendingStatus === 'INACTIVE'
                        ? 'Deactivate Test Category'
                        : 'Activate Test Category'
                }
            >
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                        {pendingStatus === 'INACTIVE'
                            ? `Are you sure you want to deactivate ${category.name}? The category record will be retained, but the category will be marked as inactive.`
                            : `Are you sure you want to activate ${category.name}?`}
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