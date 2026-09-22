import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Patient from '@/models/Patient';
import { createPatientSchema } from '@/lib/validations/patient';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        const patient = await Patient.findById(id)
            .select(
                'patientId name gender dateOfBirth age mobileNumber email address city bloodGroup emergencyContactName emergencyContactNumber status createdAt updatedAt',
            )
            .lean();

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Patient not found',
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                patient,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get patient details error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while fetching patient details',
            },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        const body = await request.json();

        const validationResult = createPatientSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation failed',
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const data = validationResult.data;

        const patient = await Patient.findById(id);

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Patient not found',
                },
                { status: 404 },
            );
        }

        patient.name = data.name;
        patient.gender = data.gender;

        patient.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;

        patient.age = data.age;

        patient.mobileNumber = data.mobileNumber;

        patient.email = data.email || undefined;

        patient.address = data.address || undefined;

        patient.city = data.city || undefined;

        patient.bloodGroup = data.bloodGroup || 'UNKNOWN';

        patient.emergencyContactName = data.emergencyContactName || undefined;

        patient.emergencyContactNumber = data.emergencyContactNumber || undefined;

        await patient.save();

        return NextResponse.json(
            {
                success: true,
                message: 'Patient updated successfully',
                patient: {
                    id: patient._id,
                    patientId: patient.patientId,
                    name: patient.name,
                    gender: patient.gender,
                    dateOfBirth: patient.dateOfBirth,
                    age: patient.age,
                    mobileNumber: patient.mobileNumber,
                    email: patient.email,
                    address: patient.address,
                    city: patient.city,
                    bloodGroup: patient.bloodGroup,
                    emergencyContactName: patient.emergencyContactName,
                    emergencyContactNumber: patient.emergencyContactNumber,
                    status: patient.status,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update patient error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while updating patient',
            },
            { status: 500 },
        );
    }
}

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        const body = await request.json();

        if (body.status !== 'ACTIVE' && body.status !== 'INACTIVE') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid patient status',
                },
                { status: 400 },
            );
        }

        const patient = await Patient.findById(id);

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Patient not found',
                },
                { status: 404 },
            );
        }

        patient.status = body.status;

        await patient.save();

        return NextResponse.json(
            {
                success: true,
                message:
                    body.status === 'ACTIVE'
                        ? 'Patient activated successfully'
                        : 'Patient deactivated successfully',
                patient: {
                    id: patient._id,
                    patientId: patient.patientId,
                    name: patient.name,
                    status: patient.status,
                    updatedAt: patient.updatedAt,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update patient status error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while updating patient status',
            },
            { status: 500 },
        );
    }
}