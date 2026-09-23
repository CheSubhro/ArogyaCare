'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';

interface DoctorFormData {
    name: string;
    qualification: string;
    specialization: string;
    registrationNumber: string;
    mobileNumber: string;
    email: string;
    clinicName: string;
    hospitalName: string;
    address: string;
    city: string;
    referralType: 'INDIVIDUAL' | 'HOSPITAL' | 'CLINIC' | 'OTHER';
}

interface Doctor {
    _id: string;
    doctorId: string;
    name: string;
    qualification?: string;
    specialization?: string;
    registrationNumber?: string;
    mobileNumber?: string;
    email?: string;
    clinicName?: string;
    hospitalName?: string;
    address?: string;
    city?: string;
    referralType: 'INDIVIDUAL' | 'HOSPITAL' | 'CLINIC' | 'OTHER';
}

type FormErrors = Partial<Record<keyof DoctorFormData, string>>;

const initialFormData: DoctorFormData = {
    name: '',
    qualification: '',
    specialization: '',
    registrationNumber: '',
    mobileNumber: '',
    email: '',
    clinicName: '',
    hospitalName: '',
    address: '',
    city: '',
    referralType: 'INDIVIDUAL',
};

export default function EditDoctorPage() {
    const params = useParams();
    const router = useRouter();

    const doctorId = params.id as string;

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [formData, setFormData] = useState<DoctorFormData>(initialFormData);

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!doctorId) return;

        const loadDoctor = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(`/api/doctors/${doctorId}`, {
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
                    setError(data.message || 'Failed to load doctor');
                    return;
                }

                const loadedDoctor: Doctor = data.doctor;

                setDoctor(loadedDoctor);

                setFormData({
                    name: loadedDoctor.name || '',
                    qualification: loadedDoctor.qualification || '',
                    specialization: loadedDoctor.specialization || '',
                    registrationNumber: loadedDoctor.registrationNumber || '',
                    mobileNumber: loadedDoctor.mobileNumber || '',
                    email: loadedDoctor.email || '',
                    clinicName: loadedDoctor.clinicName || '',
                    hospitalName: loadedDoctor.hospitalName || '',
                    address: loadedDoctor.address || '',
                    city: loadedDoctor.city || '',
                    referralType: loadedDoctor.referralType || 'INDIVIDUAL',
                });
            } catch {
                setError('Unable to load doctor details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadDoctor();
    }, [doctorId, router]);

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));

        setErrors((current) => ({
            ...current,
            [name as keyof DoctorFormData]: '',
        }));

        setError('');
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSaving(true);
        setErrors({});
        setError('');

        try {
            const response = await fetch(`/api/doctors/${doctorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.status === 401) {
                router.replace('/login');
                return;
            }

            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                }

                setError(data.message || 'Failed to update doctor. Please check the form.');

                return;
            }

            router.push(`/doctors/${doctorId}`);
            router.refresh();
        } catch {
            setError('Something went wrong. Please try again.');
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

    if (error && !doctor) {
        return (
            <div className="mx-auto max-w-4xl space-y-4">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    ← Back
                </Button>

                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="mx-auto max-w-4xl space-y-4">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    ← Back
                </Button>

                <Alert variant="danger">Doctor not found.</Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div>
                <button
                    type="button"
                    onClick={() => router.push(`/doctors/${doctorId}`)}
                    className="mb-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                    ← Back to Doctor Details
                </button>

                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    Edit Doctor / Referral
                </h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Update doctor and referral information.
                </p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <div className="border-b border-[var(--color-border)] pb-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Basic Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Doctor identification and professional details.
                        </p>
                    </div>

                    <div className="grid gap-5 pt-6 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="doctorId"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Doctor ID
                            </label>

                            <Input id="doctorId" value={doctor.doctorId} disabled />
                        </div>

                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Doctor Name
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter doctor name"
                                disabled={saving}
                            />

                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="referralType"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Referral Type
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Select
                                id="referralType"
                                name="referralType"
                                value={formData.referralType}
                                onChange={handleChange}
                                disabled={saving}
                            >
                                <option value="INDIVIDUAL">Individual Doctor</option>
                                <option value="HOSPITAL">Hospital</option>
                                <option value="CLINIC">Clinic</option>
                                <option value="OTHER">Other</option>
                            </Select>

                            {errors.referralType && (
                                <p className="mt-1 text-xs text-red-600">{errors.referralType}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="qualification"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Qualification
                            </label>

                            <Input
                                id="qualification"
                                name="qualification"
                                value={formData.qualification}
                                onChange={handleChange}
                                placeholder="e.g. MBBS, MD"
                                disabled={saving}
                            />

                            {errors.qualification && (
                                <p className="mt-1 text-xs text-red-600">{errors.qualification}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="specialization"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Specialization
                            </label>

                            <Input
                                id="specialization"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleChange}
                                placeholder="e.g. Cardiology"
                                disabled={saving}
                            />

                            {errors.specialization && (
                                <p className="mt-1 text-xs text-red-600">{errors.specialization}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="registrationNumber"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Registration Number
                            </label>

                            <Input
                                id="registrationNumber"
                                name="registrationNumber"
                                value={formData.registrationNumber}
                                onChange={handleChange}
                                placeholder="e.g. WBMC-2021-45872"
                                disabled={saving}
                            />

                            {errors.registrationNumber && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.registrationNumber}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Contact Information */}
                <Card>
                    <div className="border-b border-[var(--color-border)] pb-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Contact Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Doctor contact and associated organization details.
                        </p>
                    </div>

                    <div className="grid gap-5 pt-6 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="mobileNumber"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Mobile Number
                            </label>

                            <Input
                                id="mobileNumber"
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                placeholder="Enter 10-digit mobile number"
                                inputMode="numeric"
                                disabled={saving}
                            />

                            {errors.mobileNumber && (
                                <p className="mt-1 text-xs text-red-600">{errors.mobileNumber}</p>
                            )}
                        </div>

                        <div>
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
                                placeholder="doctor@example.com"
                                disabled={saving}
                            />

                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="clinicName"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Clinic Name
                            </label>

                            <Input
                                id="clinicName"
                                name="clinicName"
                                value={formData.clinicName}
                                onChange={handleChange}
                                placeholder="Enter clinic name"
                                disabled={saving}
                            />

                            {errors.clinicName && (
                                <p className="mt-1 text-xs text-red-600">{errors.clinicName}</p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="hospitalName"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Hospital Name
                            </label>

                            <Input
                                id="hospitalName"
                                name="hospitalName"
                                value={formData.hospitalName}
                                onChange={handleChange}
                                placeholder="Enter hospital name"
                                disabled={saving}
                            />

                            {errors.hospitalName && (
                                <p className="mt-1 text-xs text-red-600">{errors.hospitalName}</p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Address Information */}
                <Card>
                    <div className="border-b border-[var(--color-border)] pb-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Address Information
                        </h2>
                    </div>

                    <div className="grid gap-5 pt-6 sm:grid-cols-2">
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
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter address"
                                rows={4}
                                disabled={saving}
                            />

                            {errors.address && (
                                <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                            )}
                        </div>

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
                                placeholder="Enter city"
                                disabled={saving}
                            />

                            {errors.city && (
                                <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push(`/doctors/${doctorId}`)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <Spinner size="sm" />
                                Updating...
                            </span>
                        ) : (
                            'Update Doctor'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
