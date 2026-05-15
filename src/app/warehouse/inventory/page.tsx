import { getInventorySummary } from '@/app/actions/inventoryActions';
import InventoryList from '@/components/warehouse/InventoryList';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    const { data, branches, pendingAdjustments, completedAdjustments } = await getInventorySummary();

    return (
        <div style={{ padding: '2rem' }}>
            <InventoryList 
                summary={data || []} 
                branches={branches || []} 
                pendingAdjustments={pendingAdjustments || []}
                completedAdjustments={completedAdjustments || []}
            />
        </div>
    );
}
