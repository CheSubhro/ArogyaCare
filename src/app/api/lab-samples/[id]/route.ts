import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import LabSample from '@/models/LabSample';
import Patient from '@/models/Patient';
import Test from '@/models/Test';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createLabSampleSchema } from '@/lib/validations/lab-sample';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// GET - Get single lab sample
export async function GET(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid lab sample ID.',
                },
                { status: 400 },
            );
        }

        const sample = await LabSample.findById(id)
            .populate({
                path: 'patient',
                select: 'patientId name gender mobile status',
            })
            .populate({
                path: 'test',
                select: 'name code department testType sampleType specimenSite modality price status',
            })
            .lean();

        if (!sample) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Lab sample not found.',
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                sample,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get lab sample error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch lab sample.',
            },
            { status: 500 },
        );
    }
}

// PUT - Update complete lab sample
export async function PUT(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid lab sample ID.',
                },
                { status: 400 },
            );
        }

        const existingSample = await LabSample.findById(id);

        if (!existingSample) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Lab sample not found.',
                },
                { status: 404 },
            );
        }

        const body = await request.json();

        const validationResult = createLabSampleSchema.safeParse(body);

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

        const data = validationResult.data;

        // Validate Patient ID
        if (!mongoose.Types.ObjectId.isValid(data.patient)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid patient ID.',
                },
                { status: 400 },
            );
        }

        // Validate Test ID
        if (!mongoose.Types.ObjectId.isValid(data.test)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid test ID.',
                },
                { status: 400 },
            );
        }

        const patient = await Patient.findById(data.patient)
            .select('_id patientId name status')
            .lean();

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Patient not found.',
                },
                { status: 404 },
            );
        }

        const test = await Test.findById(data.test)
            .select('_id name code sampleType specimenSite status')
            .lean();

        if (!test) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test not found.',
                },
                { status: 404 },
            );
        }

        if (test.status !== 'ACTIVE') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Selected test is inactive.',
                },
                { status: 400 },
            );
        }

        if (data.status === 'REJECTED' && !data.rejectionReason?.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Rejection reason is required when sample status is REJECTED.',
                    errors: {
                        rejectionReason: ['Rejection reason is required.'],
                    },
                },
                { status: 400 },
            );
        }

        if (data.status !== 'REJECTED') {
            data.rejectionReason = '';
        }

        const updatedSample = await LabSample.findByIdAndUpdate(
            id,
            {
                patient: data.patient,
                test: data.test,

                sampleType: data.sampleType || test.sampleType || undefined,

                specimenSite: data.specimenSite || test.specimenSite || undefined,

                collectionDateTime: data.collectionDateTime
                    ? new Date(data.collectionDateTime)
                    : undefined,

                collectedBy: data.collectedBy || undefined,

                receivedDateTime: data.receivedDateTime
                    ? new Date(data.receivedDateTime)
                    : undefined,

                receivedBy: data.receivedBy || undefined,

                status: data.status,

                rejectionReason: data.rejectionReason || undefined,

                remarks: data.remarks || undefined,
            },
            {
                new: true,
                runValidators: true,
            },
        )
            .populate({
                path: 'patient',
                select: 'patientId name gender mobile status',
            })
            .populate({
                path: 'test',
                select: 'name code department testType sampleType specimenSite modality price status',
            });

        return NextResponse.json(
            {
                success: true,
                message: 'Lab sample updated successfully.',
                sample: updatedSample,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update lab sample error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update lab sample.',
            },
            { status: 500 },
        );
    }
}

// PATCH - Update lab sample status
export async function PATCH(request: Request, context: RouteContext) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid lab sample ID.',
                },
                { status: 400 },
            );
        }

        const sample = await LabSample.findById(id);

        if (!sample) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Lab sample not found.',
                },
                { status: 404 },
            );
        }

        const body = await request.json();

        const allowedStatuses = [
            'PENDING',
            'COLLECTED',
            'RECEIVED',
            'REJECTED',
            'PROCESSED',
            'CANCELLED',
        ] as const;

        const status = body.status;

        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid sample status.',
                },
                { status: 400 },
            );
        }

        if (status === 'REJECTED' && !body.rejectionReason?.trim()) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Rejection reason is required when sample status is REJECTED.',
                    errors: {
                        rejectionReason: ['Rejection reason is required.'],
                    },
                },
                { status: 400 },
            );
        }

        sample.status = status;

        if (status === 'REJECTED') {
            sample.rejectionReason = body.rejectionReason.trim();
        } else {
            sample.rejectionReason = undefined;
        }

        if (status === 'COLLECTED' && !sample.collectionDateTime) {
            sample.collectionDateTime = new Date();
        }

        if (status === 'RECEIVED' && !sample.receivedDateTime) {
            sample.receivedDateTime = new Date();
        }

        await sample.save();

        const updatedSample = await LabSample.findById(id)
            .populate({
                path: 'patient',
                select: 'patientId name gender mobile status',
            })
            .populate({
                path: 'test',
                select: 'name code department testType sampleType specimenSite modality price status',
            });

        return NextResponse.json(
            {
                success: true,
                message: 'Lab sample status updated successfully.',
                sample: updatedSample,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Update lab sample status error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update lab sample status.',
            },
            { status: 500 },
        );
    }
}