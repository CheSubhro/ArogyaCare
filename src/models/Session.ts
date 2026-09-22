
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;

    refreshTokenHash: string;

    userAgent?: string;
    ipAddress?: string;

    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        refreshTokenHash: {
            type: String,
            required: true,
            select: false,
        },

        userAgent: {
            type: String,
            trim: true,
        },

        ipAddress: {
            type: String,
            trim: true,
        },

        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

const Session: Model<ISession> =
    mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;