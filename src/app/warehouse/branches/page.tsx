import { prisma } from '@/lib/prisma';
import BranchList from '@/components/warehouse/BranchList';

export default async function BranchesPage() {
    const branches = await prisma.branch.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div style={{ padding: '2rem' }}>
            <BranchList initialBranches={branches} />
        </div>
    );
}
