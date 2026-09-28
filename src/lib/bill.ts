import Bill from '@/models/Bill';

export async function generateBillNumber(): Promise<string> {
    const lastBill = await Bill.findOne().sort({ createdAt: -1 }).select('billNumber').lean();

    if (!lastBill?.billNumber) {
        return 'BILL-000001';
    }

    const match = lastBill.billNumber.match(/^BILL-(\d+)$/);

    if (!match) {
        return 'BILL-000001';
    }

    const lastNumber = Number(match[1]);

    const nextNumber = lastNumber + 1;

    return `BILL-${String(nextNumber).padStart(6, '0')}`;
}
