import { z } from 'zod';

export const createTestSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Test name must be at least 2 characters')
        .max(150, 'Test name cannot exceed 150 characters'),

    code: z
        .string()
        .trim()
        .min(2, 'Test code must be at least 2 characters')
        .max(50, 'Test code cannot exceed 50 characters')
        .regex(
            /^[A-Z0-9_-]+$/i,
            'Test code can contain only letters, numbers, hyphens and underscores',
        )
        .transform((value) => value.toUpperCase()),

    category: z.string().trim().min(1, 'Test category is required'),

    department: z
        .string()
        .trim()
        .max(100, 'Department cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    testType: z
        .enum(['LABORATORY', 'IMAGING', 'CARDIOLOGY', 'NEUROLOGY', 'PROCEDURE', 'OTHER'])
        .default('LABORATORY'),

    sampleType: z
        .string()
        .trim()
        .max(100, 'Sample type cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    specimenSite: z
        .string()
        .trim()
        .max(150, 'Specimen/site cannot exceed 150 characters')
        .optional()
        .or(z.literal('')),

    modality: z
        .string()
        .trim()
        .max(100, 'Modality cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    preparationRequired: z.boolean().default(false),

    preparationInstructions: z
        .string()
        .trim()
        .max(1000, 'Preparation instructions cannot exceed 1000 characters')
        .optional()
        .or(z.literal('')),

    turnaroundTime: z
        .number()
        .int('Turnaround time must be a whole number')
        .min(0, 'Turnaround time cannot be negative')
        .optional(),

    turnaroundUnit: z.enum(['MINUTES', 'HOURS', 'DAYS']).default('HOURS'),

    price: z.number().min(0, 'Test price cannot be negative'),

    discountAllowed: z.boolean().default(true),

    reportType: z.enum(['NUMERIC', 'TEXT', 'STRUCTURED', 'IMAGING', 'MIXED']).default('NUMERIC'),

    displayOrder: z
        .number()
        .int('Display order must be a whole number')
        .min(0, 'Display order cannot be negative')
        .default(0),

    description: z
        .string()
        .trim()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional()
        .or(z.literal('')),

    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
