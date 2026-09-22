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

export default function AddPatientPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
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

            const response = await fetch('/api/patients', {
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

                setError(data.message || 'Unable to create patient.');

                return;
            }

            router.push('/patients');
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
                    ← Back to Patients
                </button>

                <h1 className="text-2xl font-bold text-[var(--color-text)]">Add Patient</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Create a new patient record.
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
                            Enter the patient's basic details.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 md:grid-cols-2">
                        {/* Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Patient Name <span className="text-[var(--color-danger)]">*</span>
                            </label>

                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter patient name"
                                disabled={loading}
                            />

                            {getFieldError('name') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('name')}
                                </p>
                            )}
                        </div>

                        {/* Gender */}
                        <div>
                            <label
                                htmlFor="gender"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Gender <span className="text-[var(--color-danger)]">*</span>
                            </label>

                            <Select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Select gender</option>

                                <option value="MALE">Male</option>

                                <option value="FEMALE">Female</option>

                                <option value="OTHER">Other</option>
                            </Select>

                            {getFieldError('gender') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('gender')}
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
                                disabled={loading}
                            />

                            {getFieldError('dateOfBirth') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('dateOfBirth')}
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
                                placeholder="Enter age"
                                disabled={loading}
                            />

                            {getFieldError('age') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('age')}
                                </p>
                            )}
                        </div>

                        {/* Mobile */}
                        <div>
                            <label
                                htmlFor="mobileNumber"
                                className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                            >
                                Mobile Number <span className="text-[var(--color-danger)]">*</span>
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
                                disabled={loading}
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

                            {getFieldError('bloodGroup') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('bloodGroup')}
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
                            Enter the patient's address details.
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

                {/* Emergency Contact */}
                <Card className="mb-6">
                    <div className="border-b border-[var(--color-border)] px-6 py-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                            Emergency Contact
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Optional emergency contact information.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 md:grid-cols-2">
                        {/* Emergency Name */}
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
                                placeholder="Enter contact name"
                                disabled={loading}
                            />

                            {getFieldError('emergencyContactName') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('emergencyContactName')}
                                </p>
                            )}
                        </div>

                        {/* Emergency Number */}
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
                                placeholder="Enter 10-digit mobile number"
                                maxLength={10}
                                disabled={loading}
                            />

                            {getFieldError('emergencyContactNumber') && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">
                                    {getFieldError('emergencyContactNumber')}
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
                            'Save Patient'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
