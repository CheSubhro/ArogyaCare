import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Settings from '@/models/Settings';
import { settingsSchema } from '@/lib/validations/settings';

const defaultSettings = {
    centerName: 'ArogyaCare Diagnostics',

    registrationNumber: '',
    address: '',
    city: '',
    state: 'West Bengal',
    pinCode: '',

    phone: '',
    email: '',
    website: '',

    gstNumber: '',
    panNumber: '',

    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour',
    language: 'English',
    timeZone: 'Asia/Kolkata',

    invoicePrefix: 'BILL',
    patientIdPrefix: 'PAT',
    sampleIdPrefix: 'SMP',
};

export async function GET(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        let settings = await Settings.findOne().lean();

        if (!settings) {
            const created = await Settings.create(defaultSettings);

            settings = created.toObject();
        }

        return NextResponse.json({
            success: true,
            settings,
        });
    } catch (error) {
        console.error('Get settings error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load settings.',
            },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();

        const validationResult = settingsSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Validation failed.',
                    errors: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        await connectDB();

        const settings = await Settings.findOneAndUpdate({}, validationResult.data, {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }).lean();

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully.',
            settings,
        });
    } catch (error) {
        console.error('Update settings error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update settings.',
            },
            { status: 500 },
        );
    }
}
