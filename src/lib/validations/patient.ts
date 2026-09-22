import { z } from 'zod';

export const createPatientSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Patient name must be at least 2 characters')
        .max(100, 'Patient name cannot exceed 100 characters'),

    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
        message: 'Please select a valid gender',
    }),

    dateOfBirth: z.string().trim().optional().or(z.literal('')),

    age: z.number().min(0, 'Age cannot be negative').max(150, 'Age cannot exceed 150').optional(),

    mobileNumber: z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid mobile number'),

    email: z
        .string()
        .trim()
        .email('Please enter a valid email address')
        .toLowerCase()
        .optional()
        .or(z.literal('')),

    address: z
        .string()
        .trim()
        .max(500, 'Address cannot exceed 500 characters')
        .optional()
        .or(z.literal('')),

    city: z
        .string()
        .trim()
        .max(100, 'City cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']).optional(),

    emergencyContactName: z
        .string()
        .trim()
        .max(100, 'Emergency contact name cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    emergencyContactNumber: z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid emergency contact number')
        .optional()
        .or(z.literal('')),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
