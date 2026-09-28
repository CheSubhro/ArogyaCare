import LabSample from '@/models/LabSample';

export async function generateLabSampleId(): Promise<string> {
    const lastSample = await LabSample.findOne().sort({ createdAt: -1 }).select('sampleId').lean();

    if (!lastSample?.sampleId) {
        return 'SMP-000001';
    }

    const match = lastSample.sampleId.match(/^SMP-(\d+)$/);

    if (!match) {
        return 'SMP-000001';
    }

    const lastNumber = Number(match[1]);

    const nextNumber = lastNumber + 1;

    return `SMP-${String(nextNumber).padStart(6, '0')}`;
}
