import { z } from 'zod';

export const settingsSchema = z.object({
    centerName: z
        .string()
        .trim()
        .min(2, 'Center name must be at least 2 characters.')
        .max(150, 'Center name must not exceed 150 characters.'),

    registrationNumber: z
        .string()
        .trim()
        .max(100, 'Registration number is too long.')
        .optional()
        .or(z.literal('')),

    address: z.string().trim().max(300, 'Address is too long.').optional().or(z.literal('')),

    city: z.string().trim().max(100, 'City is too long.').optional().or(z.literal('')),

    state: z.string().trim().max(100, 'State is too long.').optional().or(z.literal('')),

    pinCode: z
        .string()
        .trim()
        .regex(/^$|^\d{6}$/, 'PIN code must be 6 digits.'),

    phone: z
        .string()
        .trim()
        .regex(/^$|^[0-9+\-\s()]{7,20}$/, 'Invalid phone number.'),

    email: z.string().trim().email('Invalid email address.').optional().or(z.literal('')),

    website: z.string().trim().url('Invalid website URL.').optional().or(z.literal('')),

    gstNumber: z
        .string()
        .trim()
        .regex(/^$|^[0-9A-Z]{15}$/, 'GST number must contain 15 characters.'),

    panNumber: z
        .string()
        .trim()
        .regex(/^$|^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN number.'),

    currency: z.string().trim().min(1).max(10),

    dateFormat: z.string().trim().min(1).max(30),

    timeFormat: z.string().trim().min(1).max(30),

    language: z.string().trim().min(1).max(50),

    timeZone: z.string().trim().min(1).max(100),

    invoicePrefix: z.string().trim().min(1, 'Invoice prefix is required.').max(20),

    patientIdPrefix: z.string().trim().min(1, 'Patient ID prefix is required.').max(20),

    sampleIdPrefix: z.string().trim().min(1, 'Sample ID prefix is required.').max(20),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
