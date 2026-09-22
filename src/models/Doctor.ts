import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export type DoctorStatus =
  | "ACTIVE"
  | "INACTIVE";

export type ReferralType =
  | "INDIVIDUAL"
  | "HOSPITAL"
  | "CLINIC"
  | "OTHER";

export interface IDoctor extends Document {
  doctorId: string;

  name: string;

  qualification?: string;
  specialization?: string;
  registrationNumber?: string;

  mobileNumber?: string;
  email?: string;

  clinicName?: string;
  hospitalName?: string;

  address?: string;
  city?: string;

  referralType: ReferralType;

  status: DoctorStatus;

  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      minlength: [
        2,
        "Doctor name must be at least 2 characters",
      ],
      maxlength: [
        100,
        "Doctor name cannot exceed 100 characters",
      ],
    },

    qualification: {
      type: String,
      trim: true,
      maxlength: [
        200,
        "Qualification cannot exceed 200 characters",
      ],
    },

    specialization: {
      type: String,
      trim: true,
      maxlength: [
        150,
        "Specialization cannot exceed 150 characters",
      ],
    },

    registrationNumber: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "Registration number cannot exceed 100 characters",
      ],
    },

    mobileNumber: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    clinicName: {
      type: String,
      trim: true,
      maxlength: [
        150,
        "Clinic name cannot exceed 150 characters",
      ],
    },

    hospitalName: {
      type: String,
      trim: true,
      maxlength: [
        150,
        "Hospital name cannot exceed 150 characters",
      ],
    },

    address: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Address cannot exceed 500 characters",
      ],
    },

    city: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "City cannot exceed 100 characters",
      ],
    },

    referralType: {
      type: String,
      enum: {
        values: [
          "INDIVIDUAL",
          "HOSPITAL",
          "CLINIC",
          "OTHER",
        ],
        message: "Invalid referral type",
      },
      default: "INDIVIDUAL",
    },

    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE"],
        message: "Invalid doctor status",
      },
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

const Doctor: Model<IDoctor> =
  mongoose.models.Doctor ||
  mongoose.model<IDoctor>(
    "Doctor",
    DoctorSchema,
  );

export default Doctor;