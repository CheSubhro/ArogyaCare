import { z } from 'zod';

export const createLabSampleSchema = z.object({
    patient: z.string().trim().min(1, 'Patient is required'),

    test: z.string().trim().min(1, 'Test is required'),

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

    collectionDateTime: z.string().trim().optional().or(z.literal('')),

    collectedBy: z
        .string()
        .trim()
        .max(100, 'Collected by cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    receivedDateTime: z.string().trim().optional().or(z.literal('')),

    receivedBy: z
        .string()
        .trim()
        .max(100, 'Received by cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    status: z
        .enum(['PENDING', 'COLLECTED', 'RECEIVED', 'REJECTED', 'PROCESSED', 'CANCELLED'])
        .default('PENDING'),

    rejectionReason: z
        .string()
        .trim()
        .max(500, 'Rejection reason cannot exceed 500 characters')
        .optional()
        .or(z.literal('')),

    remarks: z
        .string()
        .trim()
        .max(1000, 'Remarks cannot exceed 1000 characters')
        .optional()
        .or(z.literal('')),
});

export type CreateLabSampleInput = z.infer<typeof createLabSampleSchema>;
