import Doctor from '@/models/Doctor';

export async function generateDoctorId(): Promise<string> {
    const lastDoctor = await Doctor.findOne().sort({ createdAt: -1 }).select('doctorId').lean();

    if (!lastDoctor?.doctorId) {
        return 'DOC-000001';
    }

    const lastNumber = Number(lastDoctor.doctorId.replace('DOC-', ''));

    const nextNumber = lastNumber + 1;

    return `DOC-${String(nextNumber).padStart(6, '0')}`;
}