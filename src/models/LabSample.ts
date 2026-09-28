import mongoose, { Document, Model, Schema } from 'mongoose';

export type LabSampleStatus =
    'PENDING' | 'COLLECTED' | 'RECEIVED' | 'REJECTED' | 'PROCESSED' | 'CANCELLED';

export interface ILabSample extends Document {
    sampleId: string;

    patient: mongoose.Types.ObjectId;

    test: mongoose.Types.ObjectId;

    sampleType?: string;

    specimenSite?: string;

    collectionDateTime?: Date;

    collectedBy?: string;

    receivedDateTime?: Date;

    receivedBy?: string;

    status: LabSampleStatus;

    rejectionReason?: string;

    remarks?: string;

    createdAt: Date;

    updatedAt: Date;
}

const LabSampleSchema = new Schema<ILabSample>(
    {
        sampleId: {
            type: String,
            required: [true, 'Sample ID is required'],
            trim: true,
            unique: true,
            index: true,
            maxlength: [50, 'Sample ID cannot exceed 50 characters'],
        },

        patient: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: [true, 'Patient is required'],
            index: true,
        },

        test: {
            type: Schema.Types.ObjectId,
            ref: 'Test',
            required: [true, 'Test is required'],
            index: true,
        },

        sampleType: {
            type: String,
            trim: true,
            maxlength: [100, 'Sample type cannot exceed 100 characters'],
        },

        specimenSite: {
            type: String,
            trim: true,
            maxlength: [150, 'Specimen/site cannot exceed 150 characters'],
        },

        collectionDateTime: {
            type: Date,
        },

        collectedBy: {
            type: String,
            trim: true,
            maxlength: [100, 'Collected by cannot exceed 100 characters'],
        },

        receivedDateTime: {
            type: Date,
        },

        receivedBy: {
            type: String,
            trim: true,
            maxlength: [100, 'Received by cannot exceed 100 characters'],
        },

        status: {
            type: String,
            enum: {
                values: ['PENDING', 'COLLECTED', 'RECEIVED', 'REJECTED', 'PROCESSED', 'CANCELLED'],
                message: 'Invalid sample status',
            },
            default: 'PENDING',
            index: true,
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
        },

        remarks: {
            type: String,
            trim: true,
            maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
        },
    },
    {
        timestamps: true,
    },
);

/*
 * Common query indexes
 */

LabSampleSchema.index({
    patient: 1,
    createdAt: -1,
});

LabSampleSchema.index({
    test: 1,
    createdAt: -1,
});

LabSampleSchema.index({
    status: 1,
    createdAt: -1,
});

LabSampleSchema.index({
    collectionDateTime: -1,
});

const LabSample: Model<ILabSample> =
    mongoose.models.LabSample || mongoose.model<ILabSample>('LabSample', LabSampleSchema);

export default LabSample;
