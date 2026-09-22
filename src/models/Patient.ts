import mongoose, { Document, Model, Schema } from 'mongoose';

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';

export type PatientStatus = 'ACTIVE' | 'INACTIVE';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';

export interface IPatient extends Document {
    patientId: string;

    name: string;
    gender: PatientGender;

    dateOfBirth?: Date;
    age?: number;

    mobileNumber: string;
    email?: string;

    address?: string;
    city?: string;

    bloodGroup?: BloodGroup;

    emergencyContactName?: string;
    emergencyContactNumber?: string;

    status: PatientStatus;

    createdAt: Date;
    updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
    {
        patientId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        name: {
            type: String,
            required: [true, 'Patient name is required'],
            trim: true,
            minlength: [2, 'Patient name must be at least 2 characters'],
            maxlength: [100, 'Patient name cannot exceed 100 characters'],
        },

        gender: {
            type: String,
            enum: {
                values: ['MALE', 'FEMALE', 'OTHER'],
                message: 'Invalid gender',
            },
            required: [true, 'Gender is required'],
        },

        dateOfBirth: {
            type: Date,
        },

        age: {
            type: Number,
            min: [0, 'Age cannot be negative'],
            max: [150, 'Age cannot exceed 150'],
        },

        mobileNumber: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        address: {
            type: String,
            trim: true,
            maxlength: [500, 'Address cannot exceed 500 characters'],
        },

        city: {
            type: String,
            trim: true,
            maxlength: [100, 'City cannot exceed 100 characters'],
        },

        bloodGroup: {
            type: String,
            enum: {
                values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'],
                message: 'Invalid blood group',
            },
            default: 'UNKNOWN',
        },

        emergencyContactName: {
            type: String,
            trim: true,
            maxlength: [100, 'Emergency contact name cannot exceed 100 characters'],
        },

        emergencyContactNumber: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: {
                values: ['ACTIVE', 'INACTIVE'],
                message: 'Invalid patient status',
            },
            default: 'ACTIVE',
        },
    },
    {
        timestamps: true,
    },
);

const Patient: Model<IPatient> =
    mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;
