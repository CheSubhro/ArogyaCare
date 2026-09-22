import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPermission extends Document {
    name: string;
    description?: string;
    module: string;
    action: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
    {
        name: {
            type: String,
            required: [true, 'Permission name is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: [255, 'Description cannot exceed 255 characters'],
        },

        module: {
            type: String,
            required: [true, 'Permission module is required'],
            trim: true,
            lowercase: true,
        },

        action: {
            type: String,
            required: [true, 'Permission action is required'],
            trim: true,
            lowercase: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

PermissionSchema.index({ module: 1, action: 1 }, { unique: true });

const Permission: Model<IPermission> =
    mongoose.models.Permission || mongoose.model<IPermission>('Permission', PermissionSchema);

export default Permission;
