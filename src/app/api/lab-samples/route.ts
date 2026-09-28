import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { generateLabSampleId } from '@/lib/lab-sample';

import LabSample from '@/models/LabSample';
import Patient from '@/models/Patient';
import Test from '@/models/Test';

import { createLabSampleSchema } from '@/lib/validations/lab-sample';

export async function POST(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const body = await request.json();

        const validationResult = createLabSampleSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Please check the submitted information.',
                    errors: validationResult.error.flatten().fieldErrors,
                },
                {
                    status: 400,
                },
            );
        }

        const data = validationResult.data;

        const patient = await Patient.findById(data.patient);

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Patient not found.',
                },
                {
                    status: 404,
                },
            );
        }

        const test = await Test.findById(data.test);

        if (!test) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Test not found.',
                },
                {
                    status: 404,
                },
            );
        }

        if (test.status !== 'ACTIVE') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Inactive tests cannot be assigned to a new sample.',
                },
                {
                    status: 400,
                },
            );
        }

        const sampleId = await generateLabSampleId();

        const sample = await LabSample.create({
            sampleId,

            patient: patient._id,

            test: test._id,

            sampleType: data.sampleType || test.sampleType || '',

            specimenSite: data.specimenSite || test.specimenSite || '',

            collectionDateTime: data.collectionDateTime
                ? new Date(data.collectionDateTime)
                : undefined,

            collectedBy: data.collectedBy || '',

            receivedDateTime: data.receivedDateTime ? new Date(data.receivedDateTime) : undefined,

            receivedBy: data.receivedBy || '',

            status: data.status,

            rejectionReason: data.rejectionReason || '',

            remarks: data.remarks || '',
        });

        const populatedSample = await LabSample.findById(sample._id)
            .populate('patient', 'patientId name gender mobileNumber')
            .populate(
                'test',
                'name code department testType sampleType specimenSite modality price',
            )
            .lean();

        return NextResponse.json(
            {
                success: true,
                message: 'Lab sample created successfully.',
                sample: populatedSample,
            },
            {
                status: 201,
            },
        );
    } catch (error) {
        console.error('Create lab sample error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while creating the lab sample.',
            },
            {
                status: 500,
            },
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

        const search = searchParams.get('search')?.trim() || '';

        const patientId = searchParams.get('patient')?.trim() || '';

        const testId = searchParams.get('test')?.trim() || '';

        const status = searchParams.get('status')?.trim() || '';

        const pageParam = Number(searchParams.get('page') || '1');

        const limitParam = Number(searchParams.get('limit') || '20');

        const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

        const limit =
            Number.isFinite(limitParam) && limitParam > 0
                ? Math.min(Math.floor(limitParam), 100)
                : 20;

        const filter: Record<string, unknown> = {};

        if (patientId) {
            if (!/^[0-9a-fA-F]{24}$/.test(patientId)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid patient ID.',
                    },
                    {
                        status: 400,
                    },
                );
            }

            filter.patient = patientId;
        }

        if (testId) {
            if (!/^[0-9a-fA-F]{24}$/.test(testId)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid test ID.',
                    },
                    {
                        status: 400,
                    },
                );
            }

            filter.test = testId;
        }

        if (status) {
            const allowedStatuses = [
                'PENDING',
                'COLLECTED',
                'RECEIVED',
                'REJECTED',
                'PROCESSED',
                'CANCELLED',
            ];

            if (!allowedStatuses.includes(status)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Invalid sample status.',
                    },
                    {
                        status: 400,
                    },
                );
            }

            filter.status = status;
        }

        if (search) {
            filter.sampleId = {
                $regex: search,
                $options: 'i',
            };
        }

        const skip = (page - 1) * limit;

        const [samples, total] = await Promise.all([
            LabSample.find(filter)
                .populate('patient', 'patientId name gender mobileNumber')
                .populate(
                    'test',
                    'name code department testType sampleType specimenSite modality price',
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            LabSample.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json(
            {
                success: true,
                samples,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
            {
                status: 200,
            },
        );
    } catch (error) {
        console.error('Get lab samples error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while fetching lab samples.',
            },
            {
                status: 500,
            },
        );
    }
}