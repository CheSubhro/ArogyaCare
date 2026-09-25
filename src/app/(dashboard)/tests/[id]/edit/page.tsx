'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
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

interface Test {
    _id: string;
    name: string;
    code: string;
    category: TestCategory | string;
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
    status: 'ACTIVE' | 'INACTIVE';
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialFormData: FormData = {
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
    status: 'ACTIVE',
};

export default function EditTestPage() {
    const params = useParams();
    const router = useRouter();

    const testId = params.id as string;

    const [formData, setFormData] = useState<FormData>(initialFormData);

    const [categories, setCategories] = useState<TestCategory[]>([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [testResponse, categoriesResponse] = await Promise.all([
                    fetch(`/api/tests/${testId}`, {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                    }),

                    fetch('/api/test-categories?status=ACTIVE', {
                        method: 'GET',
                        credentials: 'include',
                        cache: 'no-store',
                    }),
                ]);

                const testData = await testResponse.json();

                const categoriesData = await categoriesResponse.json();

                if (testResponse.status === 401 || categoriesResponse.status === 401) {
                    router.replace('/login');
                    return;
                }

                if (!testResponse.ok) {
                    setError(testData.message || 'Unable to load test details.');

                    return;
                }

                if (!categoriesResponse.ok) {
                    setError(categoriesData.message || 'Unable to load test categories.');

                    return;
                }

                const test: Test = testData.test;

                const categoryId =
                    typeof test.category === 'string' ? test.category : test.category?._id || '';

                const loadedCategories = categoriesData.categories || [];

                /*
                 * If the existing category is inactive,
                 * make sure it still appears in the edit dropdown.
                 */
                if (typeof test.category !== 'string' && test.category?._id) {
                    const categoryExists = loadedCategories.some(
                        (category: TestCategory) => category._id === test.category._id,
                    );

                    if (!categoryExists) {
                        loadedCategories.push(test.category);
                    }
                }

                setCategories(loadedCategories);

                setFormData({
                    name: test.name || '',
                    code: test.code || '',
                    category: categoryId,
                    department: test.department || '',
                    testType: test.testType || 'LABORATORY',
                    sampleType: test.sampleType || '',
                    specimenSite: test.specimenSite || '',
                    modality: test.modality || '',
                    preparationRequired: test.preparationRequired || false,
                    preparationInstructions: test.preparationInstructions || '',
                    turnaroundTime:
                        test.turnaroundTime !== undefined && test.turnaroundTime !== null
                            ? String(test.turnaroundTime)
                            : '',
                    turnaroundUnit: test.turnaroundUnit || 'HOURS',
                    price:
                        test.price !== undefined && test.price !== null ? String(test.price) : '',
                    discountAllowed: test.discountAllowed ?? true,
                    reportType: test.reportType || 'NUMERIC',
                    displayOrder:
                        test.displayOrder !== undefined && test.displayOrder !== null
                            ? String(test.displayOrder)
                            : '0',
                    description: test.description || '',
                    status: test.status || 'ACTIVE',
                });
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (testId) {
            loadData();
        }
    }, [testId, router]);

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: '',
        }));
    };

    const handleCheckboxChange = (
        field: 'preparationRequired' | 'discountAllowed',
        checked: boolean,
    ) => {
        setFormData((previous) => ({
            ...previous,
            [field]: checked,
        }));

        setErrors((previous) => ({
            ...previous,
            [field]: '',
        }));
    };

    const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const categoryId = event.target.value;

        const selectedCategory = categories.find((category) => category._id === categoryId);

        setFormData((previous) => ({
            ...previous,
            category: categoryId,
            department: selectedCategory?.department || '',
            modality: selectedCategory?.modality || '',
        }));

        setErrors((previous) => ({
            ...previous,
            category: '',
        }));
    };

    const validateForm = () => {
        const fieldErrors: FormErrors = {};

        if (!formData.name.trim()) {
            fieldErrors.name = 'Test name is required.';
        } else if (formData.name.trim().length < 2) {
            fieldErrors.name = 'Test name must be at least 2 characters.';
        }

        if (!formData.code.trim()) {
            fieldErrors.code = 'Test code is required.';
        } else if (!/^[A-Z0-9_-]+$/i.test(formData.code.trim())) {
            fieldErrors.code =
                'Test code can contain only letters, numbers, hyphens and underscores.';
        }

        if (!formData.category) {
            fieldErrors.category = 'Test category is required.';
        }

        if (formData.turnaroundTime.trim() && !/^\d+$/.test(formData.turnaroundTime.trim())) {
            fieldErrors.turnaroundTime = 'Turnaround time must be a whole number.';
        }

        if (
            !formData.price.trim() ||
            Number.isNaN(Number(formData.price)) ||
            Number(formData.price) < 0
        ) {
            fieldErrors.price = 'Please enter a valid test price.';
        }

        if (!formData.displayOrder.trim() || !/^\d+$/.test(formData.displayOrder.trim())) {
            fieldErrors.displayOrder = 'Display order must be a whole number.';
        }

        if (formData.preparationRequired && !formData.preparationInstructions.trim()) {
            fieldErrors.preparationInstructions = 'Please provide preparation instructions.';
        }

        setErrors(fieldErrors);

        return Object.keys(fieldErrors).length === 0;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSaving(true);
        setError('');
        setErrors({});

        if (!validateForm()) {
            setSaving(false);
            return;
        }

        try {
            const payload = {
                name: formData.name.trim(),

                code: formData.code.trim().toUpperCase(),

                category: formData.category,

                department: formData.department.trim(),

                testType: formData.testType,

                sampleType: formData.sampleType.trim(),

                specimenSite: formData.specimenSite.trim(),

                modality: formData.modality.trim(),

                preparationRequired: formData.preparationRequired,

                preparationInstructions: formData.preparationInstructions.trim(),

                turnaroundTime: formData.turnaroundTime.trim()
                    ? Number(formData.turnaroundTime)
                    : undefined,

                turnaroundUnit: formData.turnaroundUnit,

                price: Number(formData.price),

                discountAllowed: formData.discountAllowed,

                reportType: formData.reportType,

                displayOrder: Number(formData.displayOrder),

                description: formData.description.trim(),

                status: formData.status,
            };

            const response = await fetch(`/api/tests/${testId}`, {
                method: 'PUT',
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
                    const fieldErrors: FormErrors = {};

                    Object.entries(data.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages) && messages.length > 0) {
                            fieldErrors[field as keyof FormData] = String(messages[0]);
                        }
                    });

                    setErrors(fieldErrors);
                }

                setError(data.message || 'Unable to update test.');

                return;
            }

            router.push(`/tests/${testId}`);
        } catch {
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-96 items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (error && !formData.name) {
        return (
            <div>
                <div className="mb-6">
                    <Link
                        href={`/tests/${testId}`}
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Test
                    </Link>
                </div>

                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}

            <div className="mb-6">
                <Link
                    href={`/tests/${testId}`}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Test
                </Link>

                <h1 className="mt-3 text-2xl font-bold text-[var(--color-text)]">Edit Test</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Update test information.
                </p>
            </div>

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
                            Update the test's basic details.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Test Name */}

                        <div className="lg:col-span-2">
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Test Name
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter test name"
                            />

                            {errors.name && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Test Code */}

                        <div>
                            <label
                                htmlFor="code"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Test Code
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. CBC"
                            />

                            {errors.code && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        {/* Category */}

                        <div>
                            <label
                                htmlFor="category"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Test Category
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleCategoryChange}
                                disabled={saving}
                            >
                                <option value="">Select category</option>

                                {categories.map((category) => (
                                    <option key={category._id} value={category._id}>
                                        {category.code} - {category.name}
                                    </option>
                                ))}
                            </Select>

                            {errors.category && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.category}
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

                            <Input
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. Pathology"
                            />

                            {errors.department && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.department}
                                </p>
                            )}
                        </div>

                        {/* Test Type */}

                        <div>
                            <label
                                htmlFor="testType"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Test Type
                            </label>

                            <Select
                                id="testType"
                                name="testType"
                                value={formData.testType}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="LABORATORY">Laboratory</option>

                                <option value="IMAGING">Imaging</option>

                                <option value="CARDIOLOGY">Cardiology</option>

                                <option value="NEUROLOGY">Neurology</option>

                                <option value="PROCEDURE">Procedure</option>

                                <option value="OTHER">Other</option>
                            </Select>

                            {errors.testType && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.testType}
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
                                disabled={saving}
                                placeholder="e.g. Laboratory, X-Ray, MRI"
                            />

                            {errors.modality && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.modality}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Sample / Procedure Information */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Sample / Procedure Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update sample, specimen, or procedure site information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Sample Type */}

                        <div>
                            <label
                                htmlFor="sampleType"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Sample Type
                            </label>

                            <Input
                                id="sampleType"
                                name="sampleType"
                                value={formData.sampleType}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. Whole Blood, Serum"
                            />

                            {errors.sampleType && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.sampleType}
                                </p>
                            )}
                        </div>

                        {/* Specimen / Body Site */}

                        <div>
                            <label
                                htmlFor="specimenSite"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Specimen / Body Site
                            </label>

                            <Input
                                id="specimenSite"
                                name="specimenSite"
                                value={formData.specimenSite}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. Blood, Chest, Abdomen"
                            />

                            {errors.specimenSite && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.specimenSite}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Preparation */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Preparation
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update patient preparation requirements.
                        </p>
                    </div>

                    <div className="p-6">
                        <Checkbox
                            label="Preparation Required"
                            checked={formData.preparationRequired}
                            onChange={(event) =>
                                handleCheckboxChange('preparationRequired', event.target.checked)
                            }
                            disabled={saving}
                        />

                        {formData.preparationRequired && (
                            <div className="mt-5">
                                <label
                                    htmlFor="preparationInstructions"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Preparation Instructions
                                    <span className="ml-1 text-[var(--color-danger)]">*</span>
                                </label>

                                <Textarea
                                    id="preparationInstructions"
                                    name="preparationInstructions"
                                    rows={4}
                                    value={formData.preparationInstructions}
                                    onChange={handleChange}
                                    disabled={saving}
                                    placeholder="Enter patient preparation instructions"
                                />

                                {errors.preparationInstructions && (
                                    <p className="mt-1 text-xs text-[var(--color-danger)]">
                                        {errors.preparationInstructions}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Reporting & Turnaround */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Reporting & Turnaround
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update report format and expected turnaround time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Turnaround Time */}

                        <div>
                            <label
                                htmlFor="turnaroundTime"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Turnaround Time
                            </label>

                            <Input
                                id="turnaroundTime"
                                name="turnaroundTime"
                                type="number"
                                min="0"
                                step="1"
                                value={formData.turnaroundTime}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. 6"
                            />

                            {errors.turnaroundTime && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.turnaroundTime}
                                </p>
                            )}
                        </div>

                        {/* Time Unit */}

                        <div>
                            <label
                                htmlFor="turnaroundUnit"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Time Unit
                            </label>

                            <Select
                                id="turnaroundUnit"
                                name="turnaroundUnit"
                                value={formData.turnaroundUnit}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="MINUTES">Minutes</option>

                                <option value="HOURS">Hours</option>

                                <option value="DAYS">Days</option>
                            </Select>

                            {errors.turnaroundUnit && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.turnaroundUnit}
                                </p>
                            )}
                        </div>

                        {/* Report Type */}

                        <div>
                            <label
                                htmlFor="reportType"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Report Type
                            </label>

                            <Select
                                id="reportType"
                                name="reportType"
                                value={formData.reportType}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="NUMERIC">Numeric</option>

                                <option value="TEXT">Text</option>

                                <option value="STRUCTURED">Structured</option>

                                <option value="IMAGING">Imaging</option>

                                <option value="MIXED">Mixed</option>
                            </Select>

                            {errors.reportType && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.reportType}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Pricing */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">Pricing</h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update test pricing and discount settings.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Price */}

                        <div>
                            <label
                                htmlFor="price"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Price
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. 450"
                            />

                            {errors.price && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.price}
                                </p>
                            )}
                        </div>

                        {/* Discount */}

                        <div className="flex items-center pt-7">
                            <Checkbox
                                label="Discount Allowed"
                                checked={formData.discountAllowed}
                                onChange={(event) =>
                                    handleCheckboxChange('discountAllowed', event.target.checked)
                                }
                                disabled={saving}
                            />
                        </div>
                    </div>
                </Card>

                {/* Additional Information */}

                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Additional Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update display order, status and description.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
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
                                step="1"
                                value={formData.displayOrder}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="e.g. 1"
                            />

                            {errors.displayOrder && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.displayOrder}
                                </p>
                            )}
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
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="ACTIVE">Active</option>

                                <option value="INACTIVE">Inactive</option>
                            </Select>

                            {errors.status && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        {/* Description */}

                        <div className="sm:col-span-2">
                            <label
                                htmlFor="description"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Description
                            </label>

                            <Textarea
                                id="description"
                                name="description"
                                rows={5}
                                value={formData.description}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter additional information about this test"
                            />

                            {errors.description && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Actions */}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link href={`/tests/${testId}`}>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                    </Link>

                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
