import { prisma } from '@/lib/prisma';
import NewTransferForm from '@/components/warehouse/NewTransferForm';

export const dynamic = 'force-dynamic';

export default async function NewTransferPage() {
    const branches = await prisma.branch.findMany();
    return (
        <div style={{ padding: '2rem' }}>
            <NewTransferForm branches={branches} />
        </div>
    );
}
