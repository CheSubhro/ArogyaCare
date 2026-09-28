import { Types } from 'mongoose';
import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import {connectDB} from '@/lib/db';
import Bill from '@/models/Bill';

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

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid bill ID.',
                },
                {
                    status: 400,
                },
            );
        }

        const bill = await Bill.findById(id)
            .populate(
                'patient',
                'patientId name gender dateOfBirth age mobile email address city bloodGroup',
            )
            .populate(
                'doctor',
                'doctorId name qualification specialization registrationNumber mobileNumber email clinicName hospitalName city referralType',
            )
            .populate(
                'items.test',
                'name code department testType sampleType specimenSite modality',
            )
            .lean();

        if (!bill) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Bill not found.',
                },
                {
                    status: 404,
                },
            );
        }

        return NextResponse.json(
            {
                success: true,
                bill,
            },
            {
                status: 200,
            },
        );
    } catch (error) {
        console.error('GET /api/bills/[id] error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch bill.',
            },
            {
                status: 500,
            },
        );
    }
}