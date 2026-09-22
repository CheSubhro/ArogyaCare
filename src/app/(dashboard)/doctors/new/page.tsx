'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';

export default function AddDoctorPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
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
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

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
                qualification: formData.qualification,
                specialization: formData.specialization,
                registrationNumber: formData.registrationNumber,
                mobileNumber: formData.mobileNumber,
                email: formData.email,
                clinicName: formData.clinicName,
                hospitalName: formData.hospitalName,
                address: formData.address,
                city: formData.city,
                referralType: formData.referralType,
            };

            const response = await fetch('/api/doctors', {
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

                setError(data.message || 'Unable to create doctor / referral.');

                return;
            }

            router.push('/doctors');
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
                    ← Back to Doctors / Referrals
                </button>

                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    Add Doctor / Referral
                </h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Create a new doctor or referral source record.
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
                            Enter the basic details of the doctor or referral source.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 md:grid-cols-2">
                        {/* Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Name <span className="text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter doctor / referral name"
                                disabled={loading}
                            />

                            {getFieldError('name') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('name')}
                                </p>
                            )}
                        </div>

                        {/* Referral Type */}
                        <div>
                            <label
                                htmlFor="referralType"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Referral Type <span className="text-[var(--color-danger)]">*</span>
                            </label>

                            <Select
                                id="referralType"
                                name="referralType"
                                value={formData.referralType}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="INDIVIDUAL">Individual Doctor</option>

                                <option value="HOSPITAL">Hospital</option>

                                <option value="CLINIC">Clinic</option>

                                <option value="OTHER">Other</option>
                            </Select>

                            {getFieldError('referralType') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('referralType')}
                                </p>
                            )}
                        </div>

                        {/* Qualification */}
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
                                disabled={loading}
                            />

                            {getFieldError('qualification') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('qualification')}
                                </p>
                            )}
                        </div>

                        {/* Specialization */}
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
                                disabled={loading}
                            />

                            {getFieldError('specialization') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('specialization')}
                                </p>
                            )}
                        </div>

                        {/* Registration Number */}
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
                                placeholder="Enter registration number"
                                disabled={loading}
                            />

                            {getFieldError('registrationNumber') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('registrationNumber')}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Contact Information */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Contact Information
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Enter contact and organization details.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 md:grid-cols-2">
                        {/* Mobile */}
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
                                type="tel"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                                placeholder="Enter 10-digit mobile number"
                                maxLength={10}
                                disabled={loading}
                            />

                            {getFieldError('mobileNumber') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('mobileNumber')}
                                </p>
                            )}
                        </div>

                        {/* Email */}
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
                                placeholder="Enter email address"
                                disabled={loading}
                            />

                            {getFieldError('email') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('email')}
                                </p>
                            )}
                        </div>

                        {/* Clinic */}
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
                                disabled={loading}
                            />

                            {getFieldError('clinicName') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('clinicName')}
                                </p>
                            )}
                        </div>

                        {/* Hospital */}
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
                                disabled={loading}
                            />

                            {getFieldError('hospitalName') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('hospitalName')}
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
                            Enter the referral source address details.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 md:grid-cols-2">
                        {/* Address */}
                        <div className="md:col-span-2">
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
                                placeholder="Enter full address"
                                rows={4}
                                disabled={loading}
                            />

                            {getFieldError('address') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('address')}
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
                                placeholder="Enter city"
                                disabled={loading}
                            />

                            {getFieldError('city') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('city')}
                                </p>
                            )}
                        </div>
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
                            'Save Doctor / Referral'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
