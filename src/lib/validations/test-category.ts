import { z } from 'zod';

export const createTestCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Category name must be at least 2 characters')
        .max(100, 'Category name cannot exceed 100 characters'),

    code: z
        .string()
        .trim()
        .min(2, 'Category code must be at least 2 characters')
        .max(50, 'Category code cannot exceed 50 characters')
        .regex(
            /^[A-Z0-9_-]+$/i,
            'Category code can contain only letters, numbers, hyphens and underscores',
        )
        .transform((value) => value.toUpperCase()),

    description: z
        .string()
        .trim()
        .max(500, 'Description cannot exceed 500 characters')
        .optional()
        .or(z.literal('')),

    department: z
        .string()
        .trim()
        .max(100, 'Department cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    modality: z
        .string()
        .trim()
        .max(100, 'Modality cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    parentCategory: z.string().trim().optional().or(z.literal('')),

    displayOrder: z
        .number()
        .int('Display order must be a whole number')
        .min(0, 'Display order cannot be negative')
        .default(0),

    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export type CreateTestCategoryInput = z.infer<typeof createTestCategorySchema>;
