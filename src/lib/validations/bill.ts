import { z } from 'zod';

const billItemSchema = z.object({
    test: z.string().trim().min(1, 'Test is required'),

    testName: z
        .string()
        .trim()
        .min(1, 'Test name is required')
        .max(200, 'Test name cannot exceed 200 characters'),

    testCode: z
        .string()
        .trim()
        .min(1, 'Test code is required')
        .max(50, 'Test code cannot exceed 50 characters'),

    quantity: z.number().int().min(1, 'Quantity must be at least 1'),

    unitPrice: z.number().min(0, 'Unit price cannot be negative'),

    discountAmount: z.number().min(0, 'Item discount cannot be negative').default(0),

    totalAmount: z.number().min(0, 'Total amount cannot be negative'),
});

export const createBillSchema = z
    .object({
        patient: z.string().trim().min(1, 'Patient is required'),

        doctor: z.string().trim().optional().or(z.literal('')),

        items: z.array(billItemSchema).min(1, 'At least one test is required'),

        subtotal: z.number().min(0, 'Subtotal cannot be negative'),

        discountAmount: z.number().min(0, 'Discount cannot be negative').default(0),

        taxAmount: z.number().min(0, 'Tax cannot be negative').default(0),

        grandTotal: z.number().min(0, 'Grand total cannot be negative'),

        paidAmount: z.number().min(0, 'Paid amount cannot be negative').default(0),

        dueAmount: z.number().min(0, 'Due amount cannot be negative'),

        paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED']).default('UNPAID'),

        paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']).optional(),

        billStatus: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).default('DRAFT'),

        billDate: z.string().trim().min(1, 'Bill date is required'),

        notes: z
            .string()
            .trim()
            .max(1000, 'Notes cannot exceed 1000 characters')
            .optional()
            .or(z.literal('')),
    })
    .superRefine((data, ctx) => {
        const calculatedSubtotal = data.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0,
        );

        const calculatedItemDiscount = data.items.reduce(
            (sum, item) => sum + item.discountAmount,
            0,
        );

        const expectedSubtotal = Number(calculatedSubtotal.toFixed(2));

        const expectedGrandTotal = Number(
            (
                expectedSubtotal -
                calculatedItemDiscount -
                data.discountAmount +
                data.taxAmount
            ).toFixed(2),
        );

        const expectedDueAmount = Number((expectedGrandTotal - data.paidAmount).toFixed(2));

        if (Math.abs(data.subtotal - expectedSubtotal) > 0.01) {
            ctx.addIssue({
                code: 'custom',
                path: ['subtotal'],
                message: 'Subtotal does not match the selected tests.',
            });
        }

        if (data.discountAmount > expectedSubtotal - calculatedItemDiscount) {
            ctx.addIssue({
                code: 'custom',
                path: ['discountAmount'],
                message: 'Discount cannot exceed the bill amount.',
            });
        }

        if (expectedGrandTotal < 0) {
            ctx.addIssue({
                code: 'custom',
                path: ['grandTotal'],
                message: 'Grand total cannot be negative.',
            });
        }

        if (data.grandTotal < 0 || Math.abs(data.grandTotal - expectedGrandTotal) > 0.01) {
            ctx.addIssue({
                code: 'custom',
                path: ['grandTotal'],
                message: 'Grand total does not match the bill calculation.',
            });
        }

        if (data.paidAmount > data.grandTotal) {
            ctx.addIssue({
                code: 'custom',
                path: ['paidAmount'],
                message: 'Paid amount cannot exceed grand total.',
            });
        }

        if (Math.abs(data.dueAmount - expectedDueAmount) > 0.01) {
            ctx.addIssue({
                code: 'custom',
                path: ['dueAmount'],
                message: 'Due amount does not match the payment.',
            });
        }

        if (data.paymentStatus === 'UNPAID' && data.paidAmount > 0) {
            ctx.addIssue({
                code: 'custom',
                path: ['paymentStatus'],
                message: 'Payment status cannot be UNPAID when payment has been received.',
            });
        }

        if (data.paymentStatus === 'PAID' && data.paidAmount !== data.grandTotal) {
            ctx.addIssue({
                code: 'custom',
                path: ['paymentStatus'],
                message: 'Payment status PAID requires the full amount to be paid.',
            });
        }

        if (
            data.paymentStatus === 'PARTIAL' &&
            (data.paidAmount <= 0 || data.paidAmount >= data.grandTotal)
        ) {
            ctx.addIssue({
                code: 'custom',
                path: ['paymentStatus'],
                message:
                    'PARTIAL payment requires a payment greater than zero and less than the grand total.',
            });
        }

        if (data.paymentStatus !== 'UNPAID' && data.paidAmount > 0 && !data.paymentMethod) {
            ctx.addIssue({
                code: 'custom',
                path: ['paymentMethod'],
                message: 'Payment method is required when payment has been received.',
            });
        }
    });

export type CreateBillInput = z.infer<typeof createBillSchema>;
