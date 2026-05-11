import { getTransfers } from '@/app/actions/transferActions';
import TransferList from '@/components/warehouse/TransferList';

export const dynamic = 'force-dynamic';

export default async function TransfersPage() {
    const { data } = await getTransfers();
    return (
        <div style={{ padding: '2rem' }}>
            <TransferList transfers={data || []} />
        </div>
    );
}
