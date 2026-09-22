import { z } from 'zod';

export const createDoctorSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Doctor name must be at least 2 characters')
        .max(100, 'Doctor name cannot exceed 100 characters'),

    qualification: z
        .string()
        .trim()
        .max(200, 'Qualification cannot exceed 200 characters')
        .optional()
        .or(z.literal('')),

    specialization: z
        .string()
        .trim()
        .max(150, 'Specialization cannot exceed 150 characters')
        .optional()
        .or(z.literal('')),

    registrationNumber: z
        .string()
        .trim()
        .max(100, 'Registration number cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    mobileNumber: z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid mobile number')
        .optional()
        .or(z.literal('')),

    email: z
        .string()
        .trim()
        .email('Please enter a valid email address')
        .toLowerCase()
        .optional()
        .or(z.literal('')),

    clinicName: z
        .string()
        .trim()
        .max(150, 'Clinic name cannot exceed 150 characters')
        .optional()
        .or(z.literal('')),

    hospitalName: z
        .string()
        .trim()
        .max(150, 'Hospital name cannot exceed 150 characters')
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

    referralType: z.enum(['INDIVIDUAL', 'HOSPITAL', 'CLINIC', 'OTHER'], {
        message: 'Please select a valid referral type',
    }),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
