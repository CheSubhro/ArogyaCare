import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'USER';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface IUser extends Document {
    name: string;
    email: string;
    username?: string;
    mobileNumber?: string;
    password: string;

    role: UserRole;
    accountStatus: AccountStatus;

    emailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationTokenExpiry?: Date;

    passwordResetToken?: string;
    passwordResetTokenExpiry?: Date;

    lastLoginAt?: Date;
    lastLoginIp?: string;

    failedLoginAttempts: number;
    lockedUntil?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },

        username: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
        },

        mobileNumber: {
            type: String,
            trim: true,
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            select: false,
        },

        role: {
            type: String,
            enum: {
                values: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'USER'],
                message: 'Invalid user role',
            },
            default: 'USER',
        },

        accountStatus: {
            type: String,
            enum: {
                values: ['ACTIVE', 'INACTIVE'],
                message: 'Invalid account status',
            },
            default: 'ACTIVE',
        },

        emailVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationToken: {
            type: String,
            select: false,
        },

        emailVerificationTokenExpiry: {
            type: Date,
            select: false,
        },

        passwordResetToken: {
            type: String,
            select: false,
        },

        passwordResetTokenExpiry: {
            type: Date,
            select: false,
        },

        lastLoginAt: {
            type: Date,
        },

        lastLoginIp: {
            type: String,
            select: false,
        },

        failedLoginAttempts: {
            type: Number,
            default: 0,
            min: 0,
        },

        lockedUntil: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true,
    },
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
