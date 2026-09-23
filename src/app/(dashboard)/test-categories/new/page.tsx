'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';

interface ParentCategory {
    _id: string;
    name: string;
    code: string;
}

export default function AddTestCategoryPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        department: '',
        modality: '',
        parentCategory: '',
        displayOrder: '0',
        description: '',
    });

    const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingParents, setLoadingParents] = useState(true);

    const [error, setError] = useState('');

    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const loadParentCategories = async () => {
            try {
                setLoadingParents(true);

                const response = await fetch('/api/test-categories?status=ACTIVE', {
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

                    setError(data.message || 'Unable to load parent categories.');

                    return;
                }

                setParentCategories(
                    (data.categories || []).map((category: ParentCategory) => ({
                        _id: category._id,
                        name: category.name,
                        code: category.code,
                    })),
                );
            } catch {
                setError('Unable to load parent categories. Please try again.');
            } finally {
                setLoadingParents(false);
            }
        };

        loadParentCategories();
    }, [router]);

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (fieldErrors[name]) {
            setFieldErrors((previous) => {
                const updated = { ...previous };

                delete updated[name];

                return updated;
            });
        }

        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setLoading(true);
        setError('');
        setFieldErrors({});

        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                department: formData.department,
                modality: formData.modality,
                parentCategory: formData.parentCategory,
                displayOrder: formData.displayOrder ? Number(formData.displayOrder) : 0,
                description: formData.description,
                status: 'ACTIVE',
            };

            const response = await fetch('/api/test-categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    router.replace('/login');
                    return;
                }

                if (data.errors) {
                    setFieldErrors(data.errors);
                }

                setError(data.message || 'Unable to create test category.');

                return;
            }

            router.push('/test-categories');
            router.refresh();
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getFieldError = (fieldName: string) => {
        return fieldErrors[fieldName]?.[0];
    };

    return (
        <div className="mx-auto max-w-5xl">
            {/* Page Header */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="mb-3 text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Test Categories
                </button>

                <h1 className="text-2xl font-bold text-[var(--color-text)]">Add Test Category</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Create a new diagnostic test category.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6">
                    <Alert variant="danger">{error}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Basic Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Enter the basic details of the test category.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 md:grid-cols-2">
                        {/* Category Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Category Name <span className="text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter category name"
                                disabled={loading}
                            />

                            {getFieldError('name') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('name')}
                                </p>
                            )}
                        </div>

                        {/* Category Code */}
                        <div>
                            <label
                                htmlFor="code"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Category Code <span className="text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="e.g. PATH, HEM, XRAY"
                                disabled={loading}
                            />

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                Use a unique code for this category.
                            </p>

                            {getFieldError('code') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('code')}
                                </p>
                            )}
                        </div>

                        {/* Department */}
                        <div>
                            <label
                                htmlFor="department"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Department
                            </label>

                            <Select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Select department</option>

                                <option value="Pathology">Pathology</option>

                                <option value="Radiology">Radiology</option>

                                <option value="Cardiology">Cardiology</option>

                                <option value="Vascular">Vascular</option>

                                <option value="Neurology">Neurology</option>

                                <option value="Special Procedures">Special Procedures</option>
                            </Select>

                            {getFieldError('department') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('department')}
                                </p>
                            )}
                        </div>

                        {/* Modality */}
                        <div>
                            <label
                                htmlFor="modality"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Modality
                            </label>

                            <Input
                                id="modality"
                                name="modality"
                                value={formData.modality}
                                onChange={handleChange}
                                placeholder="e.g. Blood Test, X-Ray, CT, MRI"
                                disabled={loading}
                            />

                            {getFieldError('modality') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('modality')}
                                </p>
                            )}
                        </div>

                        {/* Parent Category */}
                        <div>
                            <label
                                htmlFor="parentCategory"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Parent Category
                            </label>

                            <Select
                                id="parentCategory"
                                name="parentCategory"
                                value={formData.parentCategory}
                                onChange={handleChange}
                                disabled={loading || loadingParents}
                            >
                                <option value="">
                                    {loadingParents
                                        ? 'Loading categories...'
                                        : 'No Parent (Root Category)'}
                                </option>

                                {parentCategories.map((category) => (
                                    <option key={category._id} value={category._id}>
                                        {category.name} ({category.code})
                                    </option>
                                ))}
                            </Select>

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                Leave empty to create a root category.
                            </p>

                            {getFieldError('parentCategory') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('parentCategory')}
                                </p>
                            )}
                        </div>

                        {/* Display Order */}
                        <div>
                            <label
                                htmlFor="displayOrder"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Display Order
                            </label>

                            <Input
                                id="displayOrder"
                                name="displayOrder"
                                type="number"
                                min="0"
                                value={formData.displayOrder}
                                onChange={handleChange}
                                placeholder="0"
                                disabled={loading}
                            />

                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                Lower numbers appear first.
                            </p>

                            {getFieldError('displayOrder') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('displayOrder')}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Description */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Description
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Add an optional description for this category.
                        </p>
                    </div>

                    <div className="p-6">
                        <label
                            htmlFor="description"
                            className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                        >
                            Category Description
                        </label>

                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Enter category description"
                            rows={5}
                            disabled={loading}
                        />

                        {getFieldError('description') && (
                            <p className="mt-1 text-xs text-[var(--color-danger)]">
                                {getFieldError('description')}
                            </p>
                        )}
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Spinner />
                                Saving...
                            </span>
                        ) : (
                            'Save Category'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
