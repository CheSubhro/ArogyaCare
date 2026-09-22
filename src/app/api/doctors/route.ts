import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createDoctorSchema } from '@/lib/validations/doctor';
import { generateDoctorId } from '@/lib/doctor';
import Doctor from '@/models/Doctor';

export async function POST(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const body = await request.json();

        const validationResult = createDoctorSchema.safeParse(body);

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

        // Prevent duplicate registration number
        if (data.registrationNumber) {
            const existingDoctor = await Doctor.findOne({
                registrationNumber: data.registrationNumber,
            }).lean();

            if (existingDoctor) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'A doctor with this registration number already exists',
                    },
                    { status: 409 },
                );
            }
        }

        const doctorId = await generateDoctorId();

        const doctor = await Doctor.create({
            doctorId,
            name: data.name,
            qualification: data.qualification || undefined,
            specialization: data.specialization || undefined,
            registrationNumber: data.registrationNumber || undefined,
            mobileNumber: data.mobileNumber || undefined,
            email: data.email || undefined,
            clinicName: data.clinicName || undefined,
            hospitalName: data.hospitalName || undefined,
            address: data.address || undefined,
            city: data.city || undefined,
            referralType: data.referralType,
            status: 'ACTIVE',
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Doctor added successfully',
                doctor: {
                    id: doctor._id,
                    doctorId: doctor.doctorId,
                    name: doctor.name,
                    qualification: doctor.qualification,
                    specialization: doctor.specialization,
                    registrationNumber: doctor.registrationNumber,
                    mobileNumber: doctor.mobileNumber,
                    email: doctor.email,
                    clinicName: doctor.clinicName,
                    hospitalName: doctor.hospitalName,
                    address: doctor.address,
                    city: doctor.city,
                    referralType: doctor.referralType,
                    status: doctor.status,
                    createdAt: doctor.createdAt,
                    updatedAt: doctor.updatedAt,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Create doctor error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while creating doctor',
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

        const search = searchParams.get('search')?.trim() || '';

        const status = searchParams.get('status')?.trim() || '';

        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                {
                    doctorId: {
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
                {
                    registrationNumber: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    specialization: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    clinicName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    hospitalName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ];
        }

        if (status === 'ACTIVE' || status === 'INACTIVE') {
            query.status = status;
        }

        const doctors = await Doctor.find(query)
            .select(
                'doctorId name qualification specialization registrationNumber mobileNumber email clinicName hospitalName address city referralType status createdAt updatedAt',
            )
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(
            {
                success: true,
                doctors,
                count: doctors.length,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Get doctors error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while fetching doctors',
            },
            { status: 500 },
        );
    }
}
