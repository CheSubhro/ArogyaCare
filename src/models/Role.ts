import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRole extends Document {
    name: string;
    description?: string;

    permissions: mongoose.Types.ObjectId[];

    isSystemRole: boolean;
    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
    {
        name: {
            type: String,
            required: [true, 'Role name is required'],
            unique: true,
            trim: true,
            uppercase: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: [255, 'Description cannot exceed 255 characters'],
        },

        permissions: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Permission',
            },
        ],

        isSystemRole: {
            type: Boolean,
            default: false,
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

const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);

export default Role;
