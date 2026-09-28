import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

import Patient from '@/models/Patient';
import Bill from '@/models/Bill';
import LabSample from '@/models/LabSample';

function getTodayRange() {
    const now = new Date();

    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const today = dateFormatter.format(now);

    const start = new Date(`${today}T00:00:00+05:30`);
    const end = new Date(`${today}T23:59:59.999+05:30`);

    return {
        start,
        end,
    };
}

function formatActivityDate(date: Date) {
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export async function GET(request: Request) {
    try {
        const authResult = requireAuth(request);

        if (!authResult.success) {
            return authResult.response;
        }

        await connectDB();

        const { start, end } = getTodayRange();

        /*
         * --------------------------------------------------
         * 1. PATIENT COUNT
         * --------------------------------------------------
         */
        const totalPatientsPromise = Patient.countDocuments({
            status: 'ACTIVE',
        });

        /*
         * --------------------------------------------------
         * 2. TODAY'S BILLING SUMMARY
         * --------------------------------------------------
         *
         * Cancelled bills are excluded from financial figures.
         */
        const billingSummaryPromise = Bill.aggregate([
            {
                $match: {
                    billDate: {
                        $gte: start,
                        $lte: end,
                    },
                    billStatus: {
                        $ne: 'CANCELLED',
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalBills: {
                        $sum: 1,
                    },
                    totalRevenue: {
                        $sum: '$grandTotal',
                    },
                    totalCollected: {
                        $sum: '$paidAmount',
                    },
                    totalDue: {
                        $sum: '$dueAmount',
                    },
                },
            },
        ]);

        /*
         * --------------------------------------------------
         * 3. RECENT BILLS
         * --------------------------------------------------
         *
         * Only 5 records are loaded for Dashboard.
         */
        const recentBillsPromise = Bill.find({
            billStatus: {
                $ne: 'CANCELLED',
            },
        })
            .populate('patient', 'name patientId mobile')
            .select(
                'billNumber patient grandTotal paidAmount dueAmount paymentStatus billStatus billDate',
            )
            .sort({
                billDate: -1,
            })
            .limit(5)
            .lean();

        /*
         * --------------------------------------------------
         * 4. RECENT LAB ACTIVITIES
         * --------------------------------------------------
         *
         * Only today's/recent samples are loaded.
         */
        const recentSamplesPromise = LabSample.find({})
            .populate('patient', 'name patientId')
            .populate('test', 'name code')
            .select('sampleId patient test status collectionDateTime createdAt')
            .sort({
                collectionDateTime: -1,
            })
            .limit(5)
            .lean();

        /*
         * --------------------------------------------------
         * EXECUTE DATABASE OPERATIONS
         * --------------------------------------------------
         *
         * These run server-side in parallel.
         * Browser still makes only ONE API request.
         */
        const [totalPatients, billingSummary, recentBills, recentSamples] = await Promise.all([
            totalPatientsPromise,
            billingSummaryPromise,
            recentBillsPromise,
            recentSamplesPromise,
        ]);

        const billing =
            billingSummary.length > 0
                ? billingSummary[0]
                : {
                      totalBills: 0,
                      totalRevenue: 0,
                      totalCollected: 0,
                      totalDue: 0,
                  };

        /*
         * --------------------------------------------------
         * RECENT BILLS
         * --------------------------------------------------
         */
        const bills = recentBills.map((bill: any) => ({
            id: bill._id.toString(),
            billNumber: bill.billNumber,
            patient: bill.patient
                ? {
                      id: bill.patient._id.toString(),
                      name: bill.patient.name,
                      patientId: bill.patient.patientId,
                      mobile: bill.patient.mobile,
                  }
                : null,
            grandTotal: bill.grandTotal,
            paidAmount: bill.paidAmount,
            dueAmount: bill.dueAmount,
            paymentStatus: bill.paymentStatus,
            billStatus: bill.billStatus,
            billDate: bill.billDate,
        }));

        /*
         * --------------------------------------------------
         * TODAY'S ACTIVITIES
         * --------------------------------------------------
         *
         * Currently activity is based on lab sample operations.
         * More activity types can be added later without
         * changing the Dashboard architecture.
         */
        const activities = recentSamples
            .map((sample: any) => ({
                id: sample._id.toString(),
                type: 'LAB_SAMPLE',
                title: 'Lab sample updated',
                description: sample.sampleId,
                patientName: sample.patient?.name || 'Unknown patient',
                testName: sample.test?.name || 'Unknown test',
                status: sample.status,
                date: sample.collectionDateTime || sample.createdAt,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map((activity) => ({
                ...activity,
                formattedDate: formatActivityDate(new Date(activity.date)),
            }));

        return NextResponse.json({
            success: true,

            summary: {
                totalPatients,
                todaysBills: billing.totalBills || 0,
                todaysRevenue: billing.totalRevenue || 0,
                todaysCollected: billing.totalCollected || 0,
                todaysDue: billing.totalDue || 0,
            },

            recentBills: bills,

            activities,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Something went wrong while loading dashboard',
            },
            {
                status: 500,
            },
        );
    }
}
