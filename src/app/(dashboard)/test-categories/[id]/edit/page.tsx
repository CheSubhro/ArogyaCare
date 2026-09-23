
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";

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
    status: "ACTIVE" | "INACTIVE";
}

interface FormData {
    name: string;
    code: string;
    department: string;
    modality: string;
    parentCategory: string;
    displayOrder: string;
    description: string;
    status: "ACTIVE" | "INACTIVE";
}

const departments = [
    "Pathology",
    "Radiology",
    "Cardiology",
    "Vascular",
    "Neurology",
    "Special Procedures",
];

export default function EditTestCategoryPage() {
    const params = useParams();
    const router = useRouter();

    const categoryId = params.id as string;

    const [category, setCategory] =
        useState<TestCategory | null>(null);

    const [parentCategories, setParentCategories] =
        useState<ParentCategory[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: "",
        code: "",
        department: "",
        modality: "",
        parentCategory: "",
        displayOrder: "0",
        description: "",
        status: "ACTIVE",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] =
        useState<Record<string, string>>({});

    useEffect(() => {
        if (!categoryId) {
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [categoryResponse, parentResponse] =
                    await Promise.all([
                        fetch(
                            `/api/test-categories/${categoryId}`,
                            {
                                method: "GET",
                                credentials: "include",
                                cache: "no-store",
                            },
                        ),
                        fetch(
                            "/api/test-categories?status=ACTIVE",
                            {
                                method: "GET",
                                credentials: "include",
                                cache: "no-store",
                            },
                        ),
                    ]);

                if (
                    categoryResponse.status === 401 ||
                    parentResponse.status === 401
                ) {
                    router.replace("/login");
                    return;
                }

                const categoryData =
                    await categoryResponse.json();

                const parentData =
                    await parentResponse.json();

                if (!categoryResponse.ok) {
                    setError(
                        categoryData.message ||
                            "Unable to load test category.",
                    );
                    return;
                }

                if (!parentResponse.ok) {
                    setError(
                        parentData.message ||
                            "Unable to load parent categories.",
                    );
                    return;
                }

                const loadedCategory =
                    categoryData.category as TestCategory;

                setCategory(loadedCategory);

                setParentCategories(
                    parentData.categories || [],
                );

                setFormData({
                    name: loadedCategory.name || "",
                    code: loadedCategory.code || "",
                    department:
                        loadedCategory.department || "",
                    modality:
                        loadedCategory.modality || "",
                    parentCategory:
                        loadedCategory.parentCategory?._id ||
                        "",
                    displayOrder:
                        String(
                            loadedCategory.displayOrder ?? 0,
                        ),
                    description:
                        loadedCategory.description || "",
                    status:
                        loadedCategory.status || "ACTIVE",
                });
            } catch {
                setError(
                    "Unable to connect to the server. Please try again.",
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [categoryId, router]);

    const handleChange = (
        field: keyof FormData,
        value: string,
    ) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [field]: "",
        }));
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setSaving(true);
        setError("");
        setFieldErrors({});

        const displayOrder =
            Number(formData.displayOrder);

        if (
            !Number.isInteger(displayOrder) ||
            displayOrder < 0
        ) {
            setFieldErrors({
                displayOrder:
                    "Display order must be a whole number greater than or equal to 0",
            });
            setSaving(false);
            return;
        }

        try {
            const response = await fetch(
                `/api/test-categories/${categoryId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name: formData.name,
                        code: formData.code,
                        department:
                            formData.department,
                        modality:
                            formData.modality,
                        parentCategory:
                            formData.parentCategory,
                        displayOrder,
                        description:
                            formData.description,
                        status: formData.status,
                    }),
                },
            );

            const data = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok) {
                if (data.errors) {
                    setFieldErrors(data.errors);
                }

                setError(
                    data.message ||
                        "Unable to update test category.",
                );
                return;
            }

            router.push(
                `/test-categories/${categoryId}`,
            );
            router.refresh();
        } catch {
            setError(
                "Unable to connect to the server. Please try again.",
            );
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

    if (error && !category) {
        return (
            <div className="space-y-4">
                <Link
                    href="/test-categories"
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Test Categories
                </Link>

                <Alert variant="danger">
                    {error}
                </Alert>
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

                <Alert variant="warning">
                    Test category record not found.
                </Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div>
                <Link
                    href={`/test-categories/${categoryId}`}
                    className="mb-2 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Category Details
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text)]">
                            Edit Test Category
                        </h1>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update the diagnostic test category information.
                        </p>
                    </div>

                    <div className="text-sm text-[var(--color-text-muted)]">
                        Category ID:{" "}
                        <span className="font-semibold text-[var(--color-primary)]">
                            {category.code}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <Alert variant="danger">
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <div className="border-b border-[var(--color-border)] pb-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Basic Information
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Update the category name, code and classification.
                            </p>
                        </div>

                        <div className="grid gap-5 pt-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Category Name
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(event) =>
                                        handleChange(
                                            "name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Enter category name"
                                    disabled={saving}
                                />

                                {fieldErrors.name && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="code"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Category Code
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(event) =>
                                        handleChange(
                                            "code",
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="e.g. PATH, HEM, XRAY"
                                    disabled={saving}
                                />

                                {fieldErrors.code && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {fieldErrors.code}
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
                                    value={
                                        formData.department
                                    }
                                    onChange={(event) =>
                                        handleChange(
                                            "department",
                                            event.target.value,
                                        )
                                    }
                                    disabled={saving}
                                >
                                    <option value="">
                                        Select department
                                    </option>

                                    {departments.map(
                                        (department) => (
                                            <option
                                                key={
                                                    department
                                                }
                                                value={
                                                    department
                                                }
                                            >
                                                {department}
                                            </option>
                                        ),
                                    )}
                                </Select>

                                {fieldErrors.department && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {
                                            fieldErrors.department
                                        }
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
                                    value={
                                        formData.modality
                                    }
                                    onChange={(event) =>
                                        handleChange(
                                            "modality",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g. Laboratory, X-Ray, MRI"
                                    disabled={saving}
                                />

                                {fieldErrors.modality && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {
                                            fieldErrors.modality
                                        }
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="parentCategory"
                                    className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                                >
                                    Parent Category
                                </label>

                                <Select
                                    id="parentCategory"
                                    value={
                                        formData.parentCategory
                                    }
                                    onChange={(event) =>
                                        handleChange(
                                            "parentCategory",
                                            event.target.value,
                                        )
                                    }
                                    disabled={saving}
                                >
                                    <option value="">
                                        No Parent — Root Category
                                    </option>

                                    {parentCategories
                                        .filter(
                                            (parent) =>
                                                parent._id !==
                                                categoryId,
                                        )
                                        .map((parent) => (
                                            <option
                                                key={
                                                    parent._id
                                                }
                                                value={
                                                    parent._id
                                                }
                                            >
                                                {parent.name} (
                                                {
                                                    parent.code
                                                }
                                                )
                                            </option>
                                        ))}
                                </Select>

                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                    Select a parent category or keep it as a root category.
                                </p>

                                {fieldErrors.parentCategory && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {
                                            fieldErrors.parentCategory
                                        }
                                    </p>
                                )}
                            </div>

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
                                    value={
                                        formData.displayOrder
                                    }
                                    onChange={(event) =>
                                        handleChange(
                                            "displayOrder",
                                            event.target.value,
                                        )
                                    }
                                    disabled={saving}
                                />

                                {fieldErrors.displayOrder && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {
                                            fieldErrors.displayOrder
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Description */}
                    <Card>
                        <div className="border-b border-[var(--color-border)] pb-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Description
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Add or update additional information about this category.
                            </p>
                        </div>

                        <div className="pt-6">
                            <label
                                htmlFor="description"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Description
                            </label>

                            <Textarea
                                id="description"
                                rows={5}
                                value={
                                    formData.description
                                }
                                onChange={(event) =>
                                    handleChange(
                                        "description",
                                        event.target.value,
                                    )
                                }
                                placeholder="Enter category description"
                                disabled={saving}
                            />

                            {fieldErrors.description && (
                                <p className="mt-1 text-xs text-red-600">
                                    {
                                        fieldErrors.description
                                    }
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Status */}
                    <Card>
                        <div className="border-b border-[var(--color-border)] pb-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text)]">
                                Category Status
                            </h2>

                            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                                Set whether this category should be active or inactive.
                            </p>
                        </div>

                        <div className="pt-6 sm:max-w-sm">
                            <label
                                htmlFor="status"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Status
                            </label>

                            <Select
                                id="status"
                                value={formData.status}
                                onChange={(event) =>
                                    handleChange(
                                        "status",
                                        event.target.value as
                                            | "ACTIVE"
                                            | "INACTIVE",
                                    )
                                }
                                disabled={saving}
                            >
                                <option value="ACTIVE">
                                    Active
                                </option>
                                <option value="INACTIVE">
                                    Inactive
                                </option>
                            </Select>

                            {fieldErrors.status && (
                                <p className="mt-1 text-xs text-red-600">
                                    {fieldErrors.status}
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href={`/test-categories/${categoryId}`}
                        >
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={saving}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                        </Link>

                        <Button
                            type="submit"
                            loading={saving}
                            className="w-full sm:w-auto"
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}