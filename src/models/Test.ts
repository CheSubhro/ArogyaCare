import mongoose, { Document, Model, Schema } from "mongoose";

export type TestStatus = "ACTIVE" | "INACTIVE";

export type TestType =
    | "LABORATORY"
    | "IMAGING"
    | "CARDIOLOGY"
    | "NEUROLOGY"
    | "PROCEDURE"
    | "OTHER";

export type ReportType =
    | "NUMERIC"
    | "TEXT"
    | "STRUCTURED"
    | "IMAGING"
    | "MIXED";

export interface ITest extends Document {
    name: string;
    code: string;

    category: mongoose.Types.ObjectId;

    department?: string;
    testType: TestType;

    sampleType?: string;
    specimenSite?: string;

    modality?: string;

    preparationRequired: boolean;
    preparationInstructions?: string;

    turnaroundTime?: number;
    turnaroundUnit: "MINUTES" | "HOURS" | "DAYS";

    price: number;
    discountAllowed: boolean;

    reportType: ReportType;

    displayOrder: number;

    description?: string;

    status: TestStatus;

    createdAt: Date;
    updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
    {
        name: {
            type: String,
            required: [true, "Test name is required"],
            trim: true,
            minlength: [
                2,
                "Test name must be at least 2 characters",
            ],
            maxlength: [
                150,
                "Test name cannot exceed 150 characters",
            ],
        },

        code: {
            type: String,
            required: [true, "Test code is required"],
            trim: true,
            uppercase: true,
            unique: true,
            index: true,
            maxlength: [
                50,
                "Test code cannot exceed 50 characters",
            ],
        },

        category: {
            type: Schema.Types.ObjectId,
            ref: "TestCategory",
            required: [true, "Test category is required"],
            index: true,
        },

        department: {
            type: String,
            trim: true,
            maxlength: [
                100,
                "Department cannot exceed 100 characters",
            ],
        },

        testType: {
            type: String,
            enum: {
                values: [
                    "LABORATORY",
                    "IMAGING",
                    "CARDIOLOGY",
                    "NEUROLOGY",
                    "PROCEDURE",
                    "OTHER",
                ],
                message: "Invalid test type",
            },
            default: "LABORATORY",
        },

        sampleType: {
            type: String,
            trim: true,
            maxlength: [
                100,
                "Sample type cannot exceed 100 characters",
            ],
        },

        specimenSite: {
            type: String,
            trim: true,
            maxlength: [
                150,
                "Specimen/site cannot exceed 150 characters",
            ],
        },

        modality: {
            type: String,
            trim: true,
            maxlength: [
                100,
                "Modality cannot exceed 100 characters",
            ],
        },

        preparationRequired: {
            type: Boolean,
            default: false,
        },

        preparationInstructions: {
            type: String,
            trim: true,
            maxlength: [
                1000,
                "Preparation instructions cannot exceed 1000 characters",
            ],
        },

        turnaroundTime: {
            type: Number,
            min: [
                0,
                "Turnaround time cannot be negative",
            ],
        },

        turnaroundUnit: {
            type: String,
            enum: {
                values: [
                    "MINUTES",
                    "HOURS",
                    "DAYS",
                ],
                message: "Invalid turnaround time unit",
            },
            default: "HOURS",
        },

        price: {
            type: Number,
            required: [true, "Test price is required"],
            min: [
                0,
                "Test price cannot be negative",
            ],
        },

        discountAllowed: {
            type: Boolean,
            default: true,
        },

        reportType: {
            type: String,
            enum: {
                values: [
                    "NUMERIC",
                    "TEXT",
                    "STRUCTURED",
                    "IMAGING",
                    "MIXED",
                ],
                message: "Invalid report type",
            },
            default: "NUMERIC",
        },

        displayOrder: {
            type: Number,
            default: 0,
            min: [
                0,
                "Display order cannot be negative",
            ],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [
                1000,
                "Description cannot exceed 1000 characters",
            ],
        },

        status: {
            type: String,
            enum: {
                values: ["ACTIVE", "INACTIVE"],
                message: "Invalid test status",
            },
            default: "ACTIVE",
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

TestSchema.index({
    name: 1,
    category: 1,
});

TestSchema.index({
    department: 1,
    status: 1,
});

const Test: Model<ITest> =
    mongoose.models.Test ||
    mongoose.model<ITest>("Test", TestSchema);

export default Test;