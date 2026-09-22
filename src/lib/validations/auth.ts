import { z } from 'zod';

export const registerSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name cannot exceed 100 characters'),

        email: z.string().trim().email('Please enter a valid email address').toLowerCase(),

        username: z
            .string()
            .trim()
            .min(3, 'Username must be at least 3 characters')
            .max(30, 'Username cannot exceed 30 characters')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username can contain only letters, numbers and underscore')
            .toLowerCase()
            .optional()
            .or(z.literal('')),

        mobileNumber: z
            .string()
            .trim()
            .regex(/^[6-9]\d{9}$/, 'Please enter a valid mobile number')
            .optional()
            .or(z.literal('')),

        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password cannot exceed 128 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type RegisterInput = z.infer<typeof registerSchema>;
