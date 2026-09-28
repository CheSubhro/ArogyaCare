'use client';

import { useEffect, useState } from 'react';

import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface SettingsData {
    centerName: string;
    registrationNumber: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    phone: string;
    email: string;
    website: string;
    gstNumber: string;
    panNumber: string;

    currency: string;
    dateFormat: string;
    timeFormat: string;
    language: string;
    timeZone: string;

    invoicePrefix: string;
    patientIdPrefix: string;
    sampleIdPrefix: string;
}

const initialSettings: SettingsData = {
    centerName: '',
    registrationNumber: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    phone: '',
    email: '',
    website: '',
    gstNumber: '',
    panNumber: '',

    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour',
    language: 'English',
    timeZone: 'Asia/Kolkata',

    invoicePrefix: 'BILL',
    patientIdPrefix: 'PAT',
    sampleIdPrefix: 'SMP',
};

export default function SettingsPage() {
    const [formData, setFormData] = useState<SettingsData>(initialSettings);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');

    const [success, setSuccess] = useState('');

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch('/api/settings', {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load settings.');
            }

            setFormData({
                ...initialSettings,
                ...data.settings,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleChange = (field: keyof SettingsData, value: string) => {
        setFormData((current) => ({
            ...current,
            [field]: value,
        }));

        setSuccess('');
        setError('');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const firstError = Object.values(data.errors).flat()[0];

                    throw new Error(
                        typeof firstError === 'string'
                            ? firstError
                            : data.message || 'Validation failed.',
                    );
                }

                throw new Error(data.message || 'Failed to update settings.');
            }

            setFormData({
                ...initialSettings,
                ...data.settings,
            });

            setSuccess(data.message || 'Settings updated successfully.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update settings.');
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

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-[var(--color-text)]">Settings</h1>

                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Manage your diagnostic center profile and application preferences.
                </p>
            </div>

            {error && (
                <Alert variant="danger">
                    <p className="text-sm">{error}</p>
                </Alert>
            )}

            {success && (
                <Alert variant="success">
                    <p className="text-sm">{success}</p>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Diagnostic Center Profile */}
                <Card>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Diagnostic Center Profile</h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Basic information about your diagnostic center.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">
                                Center Name
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <Input
                                value={formData.centerName}
                                onChange={(e) => handleChange('centerName', e.target.value)}
                                placeholder="ArogyaCare Diagnostics"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">
                                Registration Number
                            </label>

                            <Input
                                value={formData.registrationNumber}
                                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                                placeholder="Diagnostic center registration number"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Phone</label>

                            <Input
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="Contact number"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Email</label>

                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="info@example.com"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Website</label>

                            <Input
                                type="url"
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">Address</label>

                            <textarea
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                rows={3}
                                placeholder="Diagnostic center full address"
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">City</label>

                            <Input
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                placeholder="Durgapur"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">State</label>

                            <Input
                                value={formData.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                                placeholder="West Bengal"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">PIN Code</label>

                            <Input
                                value={formData.pinCode}
                                onChange={(e) => handleChange('pinCode', e.target.value)}
                                placeholder="713200"
                                maxLength={6}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">GST Number</label>

                            <Input
                                value={formData.gstNumber}
                                onChange={(e) =>
                                    handleChange('gstNumber', e.target.value.toUpperCase())
                                }
                                placeholder="15 character GST number"
                                maxLength={15}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">PAN Number</label>

                            <Input
                                value={formData.panNumber}
                                onChange={(e) =>
                                    handleChange('panNumber', e.target.value.toUpperCase())
                                }
                                placeholder="ABCDE1234F"
                                maxLength={10}
                            />
                        </div>
                    </div>
                </Card>

                {/* General Settings */}
                <Card>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">General Settings</h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Configure general application preferences.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Currency</label>

                            <Select
                                value={formData.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                            >
                                <option value="INR">INR - Indian Rupee</option>

                                <option value="USD">USD - US Dollar</option>

                                <option value="EUR">EUR - Euro</option>

                                <option value="GBP">GBP - British Pound</option>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Date Format</label>

                            <Select
                                value={formData.dateFormat}
                                onChange={(e) => handleChange('dateFormat', e.target.value)}
                            >
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>

                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>

                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Time Format</label>

                            <Select
                                value={formData.timeFormat}
                                onChange={(e) => handleChange('timeFormat', e.target.value)}
                            >
                                <option value="12-hour">12 Hour</option>

                                <option value="24-hour">24 Hour</option>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Language</label>

                            <Select
                                value={formData.language}
                                onChange={(e) => handleChange('language', e.target.value)}
                            >
                                <option value="English">English</option>

                                <option value="Bengali">Bengali</option>

                                <option value="Hindi">Hindi</option>
                            </Select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">Time Zone</label>

                            <Select
                                value={formData.timeZone}
                                onChange={(e) => handleChange('timeZone', e.target.value)}
                            >
                                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>

                                <option value="UTC">UTC</option>

                                <option value="Asia/Dhaka">Asia/Dhaka</option>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* ID Prefix Settings */}
                <Card>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">ID & Number Prefixes</h2>

                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Prefixes used when generating application identifiers.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">
                                Invoice Prefix
                            </label>

                            <Input
                                value={formData.invoicePrefix}
                                onChange={(e) =>
                                    handleChange('invoicePrefix', e.target.value.toUpperCase())
                                }
                                placeholder="BILL"
                                maxLength={20}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">
                                Patient ID Prefix
                            </label>

                            <Input
                                value={formData.patientIdPrefix}
                                onChange={(e) =>
                                    handleChange('patientIdPrefix', e.target.value.toUpperCase())
                                }
                                placeholder="PAT"
                                maxLength={20}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">
                                Sample ID Prefix
                            </label>

                            <Input
                                value={formData.sampleIdPrefix}
                                onChange={(e) =>
                                    handleChange('sampleIdPrefix', e.target.value.toUpperCase())
                                }
                                placeholder="SMP"
                                maxLength={20}
                            />
                        </div>
                    </div>
                </Card>

                {/* Save */}
                <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
