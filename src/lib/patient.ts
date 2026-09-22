import Patient from '@/models/Patient';

export async function generatePatientId(): Promise<string> {
    const lastPatient = await Patient.findOne().sort({ createdAt: -1 }).select('patientId').lean();

    if (!lastPatient?.patientId) {
        return 'PAT-000001';
    }

    const lastNumber = Number(lastPatient.patientId.replace('PAT-', ''));

    const nextNumber = lastNumber + 1;

    return `PAT-${String(nextNumber).padStart(6, '0')}`;
}