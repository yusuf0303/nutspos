import { prisma } from '@/lib/prisma';
import EmployeeList from '@/components/warehouse/EmployeeList';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
    const employees = await prisma.user.findMany({
        include: { branch: true },
        orderBy: { name: 'asc' }
    });

    const branches = await prisma.branch.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div style={{ padding: '2rem' }}>
            <EmployeeList initialEmployees={employees} branches={branches} />
        </div>
    );
}
