'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';

interface TestCategory {
    _id: string;
    name: string;
    code: string;
    department?: string;
    modality?: string;
}

interface FormData {
    name: string;
    code: string;
    category: string;
    department: string;
    testType: 'LABORATORY' | 'IMAGING' | 'CARDIOLOGY' | 'NEUROLOGY' | 'PROCEDURE' | 'OTHER';
    sampleType: string;
    specimenSite: string;
    modality: string;
    preparationRequired: boolean;
    preparationInstructions: string;
    turnaroundTime: string;
    turnaroundUnit: 'MINUTES' | 'HOURS' | 'DAYS';
    price: string;
    discountAllowed: boolean;
    reportType: 'NUMERIC' | 'TEXT' | 'STRUCTURED' | 'IMAGING' | 'MIXED';
    displayOrder: string;
    description: string;
}

const departments = [
    'Pathology',
    'Radiology',
    'Cardiology',
    'Vascular',
    'Neurology',
    'Special Procedures',
];

const testTypes = [
    {
        value: 'LABORATORY',
        label: 'Laboratory',
    },
    {
        value: 'IMAGING',
        label: 'Imaging',
    },
    {
        value: 'CARDIOLOGY',
        label: 'Cardiology',
    },
    {
        value: 'NEUROLOGY',
        label: 'Neurology',
    },
    {
        value: 'PROCEDURE',
        label: 'Procedure',
    },
    {
        value: 'OTHER',
        label: 'Other',
    },
];

const reportTypes = [
    {
        value: 'NUMERIC',
        label: 'Numeric',
    },
    {
        value: 'TEXT',
        label: 'Text',
    },
    {
        value: 'STRUCTURED',
        label: 'Structured',
    },
    {
        value: 'IMAGING',
        label: 'Imaging',
    },
    {
        value: 'MIXED',
        label: 'Mixed',
    },
];

export default function NewTestPage() {
    const router = useRouter();

    const [categories, setCategories] = useState<TestCategory[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        code: '',
        category: '',
        department: '',
        testType: 'LABORATORY',
        sampleType: '',
        specimenSite: '',
        modality: '',
        preparationRequired: false,
        preparationInstructions: '',
        turnaroundTime: '',
        turnaroundUnit: 'HOURS',
        price: '',
        discountAllowed: true,
        reportType: 'NUMERIC',
        displayOrder: '0',
        description: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch('/api/test-categories?status=ACTIVE', {
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
                    setError(data.message || 'Unable to load test categories.');
                    return;
                }

                setCategories(data.categories || []);
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, [router]);

    const handleChange = (field: keyof FormData, value: string | boolean) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [field]: '',
        }));
    };

    const handleCategoryChange = (categoryId: string) => {
        const selectedCategory = categories.find((category) => category._id === categoryId);

        setFormData((previous) => ({
            ...previous,
            category: categoryId,
            department: selectedCategory?.department || previous.department,
            modality: selectedCategory?.modality || previous.modality,
        }));

        setFieldErrors((previous) => ({
            ...previous,
            category: '',
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSaving(true);
        setError('');
        setFieldErrors({});

        const price = Number(formData.price);

        const displayOrder = Number(formData.displayOrder);

        const turnaroundTime = formData.turnaroundTime.trim()
            ? Number(formData.turnaroundTime)
            : undefined;

        if (!Number.isFinite(price) || price < 0) {
            setFieldErrors({
                price: 'Please enter a valid test price.',
            });
            setSaving(false);
            return;
        }

        if (!Number.isInteger(displayOrder) || displayOrder < 0) {
            setFieldErrors({
                displayOrder: 'Display order must be a whole number greater than or equal to 0.',
            });
            setSaving(false);
            return;
        }

        if (
            turnaroundTime !== undefined &&
            (!Number.isInteger(turnaroundTime) || turnaroundTime < 0)
        ) {
            setFieldErrors({
                turnaroundTime:
                    'Turnaround time must be a whole number greater than or equal to 0.',
            });
            setSaving(false);
            return;
        }

        try {
            const response = await fetch('/api/tests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    code: formData.code,
                    category: formData.category,
                    department: formData.department,
                    testType: formData.testType,
                    sampleType: formData.sampleType,
                    specimenSite: formData.specimenSite,
                    modality: formData.modality,
                    preparationRequired: formData.preparationRequired,
                    preparationInstructions: formData.preparationInstructions,
                    turnaroundTime,
                    turnaroundUnit: formData.turnaroundUnit,
                    price,
                    discountAllowed: formData.discountAllowed,
                    reportType: formData.reportType,
                    displayOrder,
                    description: formData.description,
                    status: 'ACTIVE',
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                router.replace('/login');
                return;
            }

            if (!response.ok) {
                if (data.errors) {
                    setFieldErrors(data.errors);
                }

                setError(data.message || 'Unable to create test.');

                return;
            }

            router.push('/tests');
            router.refresh();
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (error && categories.length === 0) {
        return (
            <div className="space-y-4">
                <Link
                    href="/tests"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Tests
                </Link>

                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/tests"
                    className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Tests
                </Link>

                <h1 className="text-2xl font-bold text-[var(--color-text)]">Add Test</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Create a new diagnostic test or service.
                </p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
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

                        <div className="grid gap-5 pt-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Test Name
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(event) => handleChange('name', event.target.value)}
                                    placeholder="e.g. Complete Blood Count"
                                    disabled={saving}
                                />

                                {fieldErrors.name && (
                                    <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="code"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Test Code
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(event) =>
                                        handleChange('code', event.target.value.toUpperCase())
                                    }
                                    placeholder="e.g. CBC"
                                    disabled={saving}
                                />

                                {fieldErrors.code && (
                                    <p className="mt-1 text-xs text-red-600">{fieldErrors.code}</p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="category"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Test Category
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <Select
                                    id="category"
                                    value={formData.category}
                                    onChange={(event) => handleCategoryChange(event.target.value)}
                                    disabled={saving}
                                >
                                    <option value="">Select test category</option>

                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name} ({category.code})
                                        </option>
                                    ))}
                                </Select>

                                {fieldErrors.category && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.category}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="department"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Department
                                </label>

                                <Select
                                    id="department"
                                    value={formData.department}
                                    onChange={(event) =>
                                        handleChange('department', event.target.value)
                                    }
                                    disabled={saving}
                                >
                                    <option value="">Select department</option>

                                    {departments.map((department) => (
                                        <option key={department} value={department}>
                                            {department}
                                        </option>
                                    ))}
                                </Select>

                                {fieldErrors.department && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.department}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="testType"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Test Type
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <Select
                                    id="testType"
                                    value={formData.testType}
                                    onChange={(event) =>
                                        handleChange(
                                            'testType',
                                            event.target.value as FormData['testType'],
                                        )
                                    }
                                    disabled={saving}
                                >
                                    {testTypes.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </Select>

                                {fieldErrors.testType && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.testType}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="modality"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Modality
                                </label>

                                <Input
                                    id="modality"
                                    value={formData.modality}
                                    onChange={(event) =>
                                        handleChange('modality', event.target.value)
                                    }
                                    placeholder="e.g. X-Ray, MRI, ECG"
                                    disabled={saving}
                                />

                                {fieldErrors.modality && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.modality}
                                    </p>
                                )}
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
                                Sample and specimen details where applicable.
                            </p>
                        </div>

                        <div className="grid gap-5 pt-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="sampleType"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Sample Type
                                </label>

                                <Input
                                    id="sampleType"
                                    value={formData.sampleType}
                                    onChange={(event) =>
                                        handleChange('sampleType', event.target.value)
                                    }
                                    placeholder="e.g. Whole Blood, Serum, Urine"
                                    disabled={saving}
                                />

                                {fieldErrors.sampleType && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.sampleType}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="specimenSite"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Specimen / Body Site
                                </label>

                                <Input
                                    id="specimenSite"
                                    value={formData.specimenSite}
                                    onChange={(event) =>
                                        handleChange('specimenSite', event.target.value)
                                    }
                                    placeholder="e.g. Blood, Chest, Knee"
                                    disabled={saving}
                                />

                                {fieldErrors.specimenSite && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.specimenSite}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Preparation */}
                    <Card>
                        <div className="border-b border-[var(--color-border)] pb-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Preparation
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Define whether the patient needs preparation before the test.
                            </p>
                        </div>

                        <div className="pt-6">
                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.preparationRequired}
                                    onChange={(event) =>
                                        handleChange('preparationRequired', event.target.checked)
                                    }
                                    disabled={saving}
                                    className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                />

                                <span className="text-sm font-medium text-[var(--color-text)]">
                                    Patient preparation required
                                </span>
                            </label>

                            {formData.preparationRequired && (
                                <div className="mt-5">
                                    <label
                                        htmlFor="preparationInstructions"
                                        className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                    >
                                        Preparation Instructions
                                    </label>

                                    <Textarea
                                        id="preparationInstructions"
                                        rows={4}
                                        value={formData.preparationInstructions}
                                        onChange={(event) =>
                                            handleChange(
                                                'preparationInstructions',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g. Fasting for 8–10 hours before sample collection."
                                        disabled={saving}
                                    />

                                    {fieldErrors.preparationInstructions && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {fieldErrors.preparationInstructions}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Reporting and Turnaround */}
                    <Card>
                        <div className="border-b border-[var(--color-border)] pb-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Reporting & Turnaround
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Configure report format and expected turnaround time.
                            </p>
                        </div>

                        <div className="grid gap-5 pt-6 sm:grid-cols-3">
                            <div>
                                <label
                                    htmlFor="turnaroundTime"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Turnaround Time
                                </label>

                                <Input
                                    id="turnaroundTime"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.turnaroundTime}
                                    onChange={(event) =>
                                        handleChange('turnaroundTime', event.target.value)
                                    }
                                    placeholder="e.g. 6"
                                    disabled={saving}
                                />

                                {fieldErrors.turnaroundTime && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.turnaroundTime}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="turnaroundUnit"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Time Unit
                                </label>

                                <Select
                                    id="turnaroundUnit"
                                    value={formData.turnaroundUnit}
                                    onChange={(event) =>
                                        handleChange(
                                            'turnaroundUnit',
                                            event.target.value as FormData['turnaroundUnit'],
                                        )
                                    }
                                    disabled={saving}
                                >
                                    <option value="MINUTES">Minutes</option>
                                    <option value="HOURS">Hours</option>
                                    <option value="DAYS">Days</option>
                                </Select>

                                {fieldErrors.turnaroundUnit && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.turnaroundUnit}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="reportType"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Report Type
                                </label>

                                <Select
                                    id="reportType"
                                    value={formData.reportType}
                                    onChange={(event) =>
                                        handleChange(
                                            'reportType',
                                            event.target.value as FormData['reportType'],
                                        )
                                    }
                                    disabled={saving}
                                >
                                    {reportTypes.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </Select>

                                {fieldErrors.reportType && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.reportType}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Pricing */}
                    <Card>
                        <div className="border-b border-[var(--color-border)] pb-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Pricing
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Configure the standard price and discount availability.
                            </p>
                        </div>

                        <div className="grid gap-5 pt-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="price"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Price
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(event) => handleChange('price', event.target.value)}
                                    placeholder="e.g. 450"
                                    disabled={saving}
                                />

                                {fieldErrors.price && (
                                    <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>
                                )}
                            </div>

                            <div className="flex items-center pt-6">
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.discountAllowed}
                                        onChange={(event) =>
                                            handleChange('discountAllowed', event.target.checked)
                                        }
                                        disabled={saving}
                                        className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />

                                    <span className="text-sm font-medium text-[var(--color-text)]">
                                        Discount allowed
                                    </span>
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* Other Information */}
                    <Card>
                        <div className="border-b border-[var(--color-border)] pb-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Other Information
                            </h2>
                        </div>

                        <div className="grid gap-5 pt-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="displayOrder"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Display Order
                                </label>

                                <Input
                                    id="displayOrder"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.displayOrder}
                                    onChange={(event) =>
                                        handleChange('displayOrder', event.target.value)
                                    }
                                    disabled={saving}
                                />

                                {fieldErrors.displayOrder && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.displayOrder}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="description"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Description
                                </label>

                                <Textarea
                                    id="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={(event) =>
                                        handleChange('description', event.target.value)
                                    }
                                    placeholder="Enter additional information about this test."
                                    disabled={saving}
                                />

                                {fieldErrors.description && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link href="/tests">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={saving}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                        </Link>

                        <Button type="submit" loading={saving} className="w-full sm:w-auto">
                            Create Test
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
