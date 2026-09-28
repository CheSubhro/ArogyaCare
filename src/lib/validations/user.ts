import { z } from 'zod';

export const userRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'USER']);

export const accountStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export const createUserSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name cannot exceed 100 characters'),

        email: z
            .string()
            .trim()
            .email('Please enter a valid email address')
            .transform((value) => value.toLowerCase()),

        username: z
            .string()
            .trim()
            .min(3, 'Username must be at least 3 characters')
            .max(30, 'Username cannot exceed 30 characters')
            .optional()
            .or(z.literal('')),

        mobileNumber: z
            .string()
            .trim()
            .max(20, 'Mobile number cannot exceed 20 characters')
            .optional()
            .or(z.literal('')),

        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password cannot exceed 100 characters'),

        confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),

        role: userRoleSchema,

        accountStatus: accountStatusSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const updateUserSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name cannot exceed 100 characters')
            .optional(),

        email: z
            .string()
            .trim()
            .email('Please enter a valid email address')
            .transform((value) => value.toLowerCase())
            .optional(),

        username: z
            .string()
            .trim()
            .min(3, 'Username must be at least 3 characters')
            .max(30, 'Username cannot exceed 30 characters')
            .optional()
            .or(z.literal('')),

        mobileNumber: z
            .string()
            .trim()
            .max(20, 'Mobile number cannot exceed 20 characters')
            .optional()
            .or(z.literal('')),

        role: userRoleSchema.optional(),

        accountStatus: accountStatusSchema.optional(),

        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password cannot exceed 100 characters')
            .optional(),

        confirmPassword: z
            .string()
            .min(8, 'Confirm password must be at least 8 characters')
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (data.password || data.confirmPassword) {
            if (!data.password || !data.confirmPassword) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['confirmPassword'],
                    message: 'Both password fields are required',
                });

                return;
            }

            if (data.password !== data.confirmPassword) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['confirmPassword'],
                    message: 'Passwords do not match',
                });
            }
        }
    });
