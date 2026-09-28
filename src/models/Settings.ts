import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISettings extends Document {
    centerName: string;
    registrationNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    gstNumber?: string;
    panNumber?: string;

    currency: string;
    dateFormat: string;
    timeFormat: string;
    language: string;
    timeZone: string;

    invoicePrefix: string;
    patientIdPrefix: string;
    sampleIdPrefix: string;

    createdAt: Date;
    updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
    {
        centerName: {
            type: String,
            required: true,
            trim: true,
        },

        registrationNumber: {
            type: String,
            trim: true,
            default: '',
        },

        address: {
            type: String,
            trim: true,
            default: '',
        },

        city: {
            type: String,
            trim: true,
            default: '',
        },

        state: {
            type: String,
            trim: true,
            default: '',
        },

        pinCode: {
            type: String,
            trim: true,
            default: '',
        },

        phone: {
            type: String,
            trim: true,
            default: '',
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: '',
        },

        website: {
            type: String,
            trim: true,
            default: '',
        },

        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: '',
        },

        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
            default: '',
        },

        currency: {
            type: String,
            trim: true,
            default: 'INR',
        },

        dateFormat: {
            type: String,
            trim: true,
            default: 'DD/MM/YYYY',
        },

        timeFormat: {
            type: String,
            trim: true,
            default: '12-hour',
        },

        language: {
            type: String,
            trim: true,
            default: 'English',
        },

        timeZone: {
            type: String,
            trim: true,
            default: 'Asia/Kolkata',
        },

        invoicePrefix: {
            type: String,
            trim: true,
            default: 'BILL',
        },

        patientIdPrefix: {
            type: String,
            trim: true,
            default: 'PAT',
        },

        sampleIdPrefix: {
            type: String,
            trim: true,
            default: 'SMP',
        },
    },
    {
        timestamps: true,
    },
);

const Settings: Model<ISettings> =
    mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
