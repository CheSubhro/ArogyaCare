import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { generatePatientId } from '@/lib/patient';
import { createPatientSchema } from '@/lib/validations/patient';
import Patient from '@/models/Patient';

export async function POST(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

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

        const patientId = await generatePatientId();

        const patient = await Patient.create({
            patientId,
            name: data.name,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            age: data.age,
            mobileNumber: data.mobileNumber,
            email: data.email || undefined,
            address: data.address || undefined,
            city: data.city || undefined,
            bloodGroup: data.bloodGroup || 'UNKNOWN',
            emergencyContactName: data.emergencyContactName || undefined,
            emergencyContactNumber: data.emergencyContactNumber || undefined,
            status: 'ACTIVE',
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Patient created successfully',
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
            { status: 201 },
        );
    } catch (error) {
        console.error('Create patient error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while creating patient',
            },
            { status: 500 },
        );
    }
}

export async function GET(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { searchParams } = new URL(request.url);

        const search = searchParams.get('search')?.trim();

        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                {
                    patientId: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    name: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    mobileNumber: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        const patients = await Patient.find(query)
            .sort({ createdAt: -1 })
            .select(
                'patientId name gender age mobileNumber email city bloodGroup status createdAt updatedAt',
            )
            .lean();

        return NextResponse.json(
            {
                success: true,
                patients,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get patients error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while fetching patients',
            },
            { status: 500 },
        );
    }
}