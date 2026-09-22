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