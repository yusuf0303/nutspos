import { prisma } from '@/lib/prisma';
import NewAdjustmentForm from '@/components/warehouse/NewAdjustmentForm';

export default async function NewAdjustmentPage() {
    const branches = await prisma.branch.findMany();

    return (
        <div style={{ padding: '2rem' }}>
            <NewAdjustmentForm branches={branches} />
        </div>
    );
}
