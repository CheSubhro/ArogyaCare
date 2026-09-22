import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Patient from '@/models/Patient';

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
