import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Doctor from '@/models/Doctor';
import { createDoctorSchema } from '@/lib/validations/doctor';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// GET - Get single doctor
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        await requireAuth(request);
        await connectDB();

        const { id } = await context.params;

        const doctor = await Doctor.findById(id).lean();

        if (!doctor) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Doctor not found',
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                doctor,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get doctor error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch doctor',
            },
            { status: 500 },
        );
    }
}

// PUT - Update doctor
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        await requireAuth(request);
        await connectDB();

        const { id } = await context.params;

        const existingDoctor = await Doctor.findById(id);

        if (!existingDoctor) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Doctor not found',
                },
                { status: 404 },
            );
        }

        const body = await request.json();

        const validationResult = createDoctorSchema.safeParse(body);

        if (!validationResult.success) {
            const errors: Record<string, string> = {};

            validationResult.error.issues.forEach((issue) => {
                const field = issue.path[0];

                if (typeof field === 'string' && !errors[field]) {
                    errors[field] = issue.message;
                }
            });

            return NextResponse.json(
                {
                    success: false,
                    message: 'Please correct the highlighted fields',
                    errors,
                },
                { status: 400 },
            );
        }

        const data = validationResult.data;

        // Check duplicate registration number
        if (data.registrationNumber) {
            const duplicateDoctor = await Doctor.findOne({
                registrationNumber: data.registrationNumber,
                _id: { $ne: id },
            }).lean();

            if (duplicateDoctor) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'A doctor with this registration number already exists',
                        errors: {
                            registrationNumber: 'This registration number is already in use',
                        },
                    },
                    { status: 409 },
                );
            }
        }

        existingDoctor.name = data.name;
        existingDoctor.qualification = data.qualification || '';
        existingDoctor.specialization = data.specialization || '';
        existingDoctor.registrationNumber = data.registrationNumber || '';
        existingDoctor.mobileNumber = data.mobileNumber || '';
        existingDoctor.email = data.email || '';
        existingDoctor.clinicName = data.clinicName || '';
        existingDoctor.hospitalName = data.hospitalName || '';
        existingDoctor.address = data.address || '';
        existingDoctor.city = data.city || '';
        existingDoctor.referralType = data.referralType;

        await existingDoctor.save();

        return NextResponse.json(
            {
                success: true,
                message: 'Doctor updated successfully',
                doctor: existingDoctor,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update doctor error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update doctor',
            },
            { status: 500 },
        );
    }
}

// PATCH - Update doctor status
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        await requireAuth(request);
        await connectDB();

        const { id } = await context.params;

        const doctor = await Doctor.findById(id);

        if (!doctor) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Doctor not found',
                },
                { status: 404 },
            );
        }

        const body = await request.json();

        if (!body.status) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Status is required',
                },
                { status: 400 },
            );
        }

        if (!['ACTIVE', 'INACTIVE'].includes(body.status)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid doctor status',
                },
                { status: 400 },
            );
        }

        doctor.status = body.status;

        await doctor.save();

        return NextResponse.json(
            {
                success: true,
                message: `Doctor ${
                    body.status === 'ACTIVE' ? 'activated' : 'deactivated'
                } successfully`,
                doctor,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update doctor status error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update doctor status',
            },
            { status: 500 },
        );
    }
}