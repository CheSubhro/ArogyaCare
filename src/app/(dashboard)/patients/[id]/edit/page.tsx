'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';

interface FormData {
    name: string;
    gender: string;
    dateOfBirth: string;
    age: string;
    mobileNumber: string;
    email: string;
    address: string;
    city: string;
    bloodGroup: string;
    emergencyContactName: string;
    emergencyContactNumber: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialFormData: FormData = {
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    mobileNumber: '',
    email: '',
    address: '',
    city: '',
    bloodGroup: 'UNKNOWN',
    emergencyContactName: '',
    emergencyContactNumber: '',
};

export default function EditPatientPage() {
    const params = useParams();
    const router = useRouter();

    const patientId = params.id as string;

    const [formData, setFormData] = useState<FormData>(initialFormData);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        const loadPatient = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`/api/patients/${patientId}`, {
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

                    setError(data.message || 'Unable to load patient details.');

                    return;
                }

                const patient = data.patient;

                setFormData({
                    name: patient.name || '',
                    gender: patient.gender || '',
                    dateOfBirth: patient.dateOfBirth
                        ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
                        : '',
                    age:
                        patient.age !== undefined && patient.age !== null
                            ? String(patient.age)
                            : '',
                    mobileNumber: patient.mobileNumber || '',
                    email: patient.email || '',
                    address: patient.address || '',
                    city: patient.city || '',
                    bloodGroup: patient.bloodGroup || 'UNKNOWN',
                    emergencyContactName: patient.emergencyContactName || '',
                    emergencyContactNumber: patient.emergencyContactNumber || '',
                });
            } catch {
                setError('Unable to connect to the server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (patientId) {
            loadPatient();
        }
    }, [patientId, router]);

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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSaving(true);
        setError('');
        setErrors({});

        try {
            const payload = {
                name: formData.name,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth,
                age: formData.age ? Number(formData.age) : undefined,
                mobileNumber: formData.mobileNumber,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                bloodGroup: formData.bloodGroup,
                emergencyContactName: formData.emergencyContactName,
                emergencyContactNumber: formData.emergencyContactNumber,
            };

            const response = await fetch(`/api/patients/${patientId}`, {
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

                setError(data.message || 'Unable to update patient.');

                return;
            }

            router.push(`/patients/${patientId}`);
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
                        href={`/patients/${patientId}`}
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                        ← Back to Patient
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
                    href={`/patients/${patientId}`}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Patient
                </Link>

                <h1 className="mt-3 text-2xl font-bold text-[var(--color-text)]">Edit Patient</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Update patient information.
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
                            Update the patient's basic details.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Name */}
                        <div className="lg:col-span-2">
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Patient Name
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter patient name"
                            />

                            {errors.name && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Gender */}
                        <div>
                            <label
                                htmlFor="gender"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Gender
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="">Select gender</option>

                                <option value="MALE">Male</option>

                                <option value="FEMALE">Female</option>

                                <option value="OTHER">Other</option>
                            </Select>

                            {errors.gender && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.gender}
                                </p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label
                                htmlFor="dateOfBirth"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Date of Birth
                            </label>

                            <Input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                disabled={saving}
                            />

                            {errors.dateOfBirth && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.dateOfBirth}
                                </p>
                            )}
                        </div>

                        {/* Age */}
                        <div>
                            <label
                                htmlFor="age"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Age
                            </label>

                            <Input
                                id="age"
                                name="age"
                                type="number"
                                min="0"
                                max="150"
                                value={formData.age}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter age"
                            />

                            {errors.age && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.age}
                                </p>
                            )}
                        </div>

                        {/* Mobile */}
                        <div>
                            <label
                                htmlFor="mobileNumber"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Mobile Number
                                <span className="ml-1 text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="mobileNumber"
                                name="mobileNumber"
                                type="tel"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="10-digit mobile number"
                            />

                            {errors.mobileNumber && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.mobileNumber}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="lg:col-span-2">
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Email
                            </label>

                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="patient@example.com"
                            />

                            {errors.email && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Blood Group */}
                        <div>
                            <label
                                htmlFor="bloodGroup"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Blood Group
                            </label>

                            <Select
                                id="bloodGroup"
                                name="bloodGroup"
                                value={formData.bloodGroup}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="UNKNOWN">Unknown</option>

                                <option value="A+">A+</option>

                                <option value="A-">A-</option>

                                <option value="B+">B+</option>

                                <option value="B-">B-</option>

                                <option value="AB+">AB+</option>

                                <option value="AB-">AB-</option>

                                <option value="O+">O+</option>

                                <option value="O-">O-</option>
                            </Select>

                            {errors.bloodGroup && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.bloodGroup}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Address Information */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Address Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update the patient's address.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Address */}
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="address"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Address
                            </label>

                            <Textarea
                                id="address"
                                name="address"
                                rows={4}
                                value={formData.address}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter patient's address"
                            />

                            {errors.address && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        {/* City */}
                        <div>
                            <label
                                htmlFor="city"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                City
                            </label>

                            <Input
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter city"
                            />

                            {errors.city && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.city}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Emergency Contact */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Emergency Contact
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Update emergency contact information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        {/* Contact Name */}
                        <div>
                            <label
                                htmlFor="emergencyContactName"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Contact Name
                            </label>

                            <Input
                                id="emergencyContactName"
                                name="emergencyContactName"
                                value={formData.emergencyContactName}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter contact name"
                            />

                            {errors.emergencyContactName && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.emergencyContactName}
                                </p>
                            )}
                        </div>

                        {/* Contact Number */}
                        <div>
                            <label
                                htmlFor="emergencyContactNumber"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Contact Number
                            </label>

                            <Input
                                id="emergencyContactNumber"
                                name="emergencyContactNumber"
                                type="tel"
                                value={formData.emergencyContactNumber}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="10-digit mobile number"
                            />

                            {errors.emergencyContactNumber && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {errors.emergencyContactNumber}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link href={`/patients/${patientId}`}>
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
