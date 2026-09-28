import mongoose, { Document, Model, Schema } from 'mongoose';

export type BillStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

export interface IBillItem {
    test: mongoose.Types.ObjectId;
    testName: string;
    testCode: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    totalAmount: number;
}

export interface IBill extends Document {
    billNumber: string;

    patient: mongoose.Types.ObjectId;

    doctor?: mongoose.Types.ObjectId | null;

    items: IBillItem[];

    subtotal: number;

    discountAmount: number;

    taxAmount: number;

    grandTotal: number;

    paidAmount: number;

    dueAmount: number;

    paymentStatus: PaymentStatus;

    paymentMethod?: PaymentMethod;

    billStatus: BillStatus;

    billDate: Date;

    notes?: string;

    createdAt: Date;

    updatedAt: Date;
}

const BillItemSchema = new Schema<IBillItem>(
    {
        test: {
            type: Schema.Types.ObjectId,
            ref: 'Test',
            required: [true, 'Test is required'],
        },

        testName: {
            type: String,
            required: [true, 'Test name is required'],
            trim: true,
            maxlength: [200, 'Test name cannot exceed 200 characters'],
        },

        testCode: {
            type: String,
            required: [true, 'Test code is required'],
            trim: true,
            uppercase: true,
            maxlength: [50, 'Test code cannot exceed 50 characters'],
        },

        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
            default: 1,
        },

        unitPrice: {
            type: Number,
            required: true,
            min: [0, 'Unit price cannot be negative'],
        },

        discountAmount: {
            type: Number,
            required: true,
            min: [0, 'Item discount cannot be negative'],
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: [0, 'Total amount cannot be negative'],
        },
    },
    {
        _id: false,
    },
);

const BillSchema = new Schema<IBill>(
    {
        billNumber: {
            type: String,
            required: [true, 'Bill number is required'],
            trim: true,
            unique: true,
            index: true,
            maxlength: [50, 'Bill number cannot exceed 50 characters'],
        },

        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient is required'],
            index: true,
        },

        doctor: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            default: null,
            index: true,
        },

        items: {
            type: [BillItemSchema],
            required: true,
            validate: {
                validator: function (value: IBillItem[]) {
                    return value.length > 0;
                },
                message: 'At least one test is required',
            },
        },

        subtotal: {
            type: Number,
            required: true,
            min: [0, 'Subtotal cannot be negative'],
        },

        discountAmount: {
            type: Number,
            required: true,
            min: [0, 'Discount cannot be negative'],
            default: 0,
        },

        taxAmount: {
            type: Number,
            required: true,
            min: [0, 'Tax cannot be negative'],
            default: 0,
        },

        grandTotal: {
            type: Number,
            required: true,
            min: [0, 'Grand total cannot be negative'],
        },

        paidAmount: {
            type: Number,
            required: true,
            min: [0, 'Paid amount cannot be negative'],
            default: 0,
        },

        dueAmount: {
            type: Number,
            required: true,
            min: [0, 'Due amount cannot be negative'],
            default: 0,
        },

        paymentStatus: {
            type: String,
            enum: {
                values: ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'],
                message: 'Invalid payment status',
            },
            default: 'UNPAID',
            index: true,
        },

        paymentMethod: {
            type: String,
            enum: {
                values: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'],
                message: 'Invalid payment method',
            },
        },

        billStatus: {
            type: String,
            enum: {
                values: ['DRAFT', 'CONFIRMED', 'CANCELLED'],
                message: 'Invalid bill status',
            },
            default: 'DRAFT',
            index: true,
        },

        billDate: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },
    },
    {
        timestamps: true,
    },
);

BillSchema.index({
    patient: 1,
    createdAt: -1,
});

BillSchema.index({
    billStatus: 1,
    createdAt: -1,
});

BillSchema.index({
    paymentStatus: 1,
    createdAt: -1,
});

BillSchema.index({
    billDate: -1,
});

const Bill: Model<IBill> = mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);

export default Bill;
