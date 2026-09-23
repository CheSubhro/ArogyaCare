
import mongoose, { Document, Model, Schema } from 'mongoose';

export type TestCategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface ITestCategory extends Document {
    name: string;
    code: string;
    description?: string;

    department?: string;
    modality?: string;

    parentCategory?: mongoose.Types.ObjectId | null;

    displayOrder: number;
    status: TestCategoryStatus;

    createdAt: Date;
    updatedAt: Date;
}

const TestCategorySchema = new Schema<ITestCategory>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            minlength: [2, 'Category name must be at least 2 characters'],
            maxlength: [100, 'Category name cannot exceed 100 characters'],
        },

        code: {
            type: String,
            required: [true, 'Category code is required'],
            trim: true,
            uppercase: true,
            unique: true,
            index: true,
            maxlength: [50, 'Category code cannot exceed 50 characters'],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },

        department: {
            type: String,
            trim: true,
            maxlength: [100, 'Department cannot exceed 100 characters'],
        },

        modality: {
            type: String,
            trim: true,
            maxlength: [100, 'Modality cannot exceed 100 characters'],
        },

        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: 'TestCategory',
            default: null,
            index: true,
        },

        displayOrder: {
            type: Number,
            default: 0,
            min: [0, 'Display order cannot be negative'],
        },

        status: {
            type: String,
            enum: {
                values: ['ACTIVE', 'INACTIVE'],
                message: 'Invalid category status',
            },
            default: 'ACTIVE',
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

TestCategorySchema.index({
    name: 1,
    department: 1,
});

const TestCategory: Model<ITestCategory> =
    mongoose.models.TestCategory ||
    mongoose.model<ITestCategory>('TestCategory', TestCategorySchema);

export default TestCategory;