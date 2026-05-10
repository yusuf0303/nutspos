import { prisma } from '@/lib/prisma';
import ExportButton from '@/components/analytics/ExportButton';

export default async function WarehouseDashboard() {
    // ... existing code ...
    // (Wait, I should be careful not to overwrite the whole file incorrectly)
    // Let's just target the button.
    let stats = { products: 0, categories: 0, lowStock: 0, dailySales: 0, dailyOrders: 0, dailyCOGS: 0, dailyExpenses: 0, inventoryValuation: 0 };
    let topProducts: any[] = [];

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        stats.products = await prisma.product.count();
        stats.categories = await prisma.category.count();

        // Inventory stats
        const inventory = await prisma.inventory.findMany({
            include: { product: true }
        });

        stats.lowStock = inventory.filter(i => i.quantity < 10).length;
        stats.inventoryValuation = inventory.reduce((sum, item) => sum + (item.product.cost * item.quantity), 0);

        // Sales stats
        const dailyOrdersData = await prisma.order.findMany({
            where: {
                createdAt: { gte: today },
                status: 'COMPLETED'
            },
            include: { items: true }
        });

        stats.dailySales = dailyOrdersData.reduce((acc, curr) => acc + curr.totalAmount, 0);
        stats.dailyOrders = dailyOrdersData.length;

        // COGS Calculation
        stats.dailyCOGS = dailyOrdersData.reduce((sum, order) => {
            return sum + (order.items as any[]).reduce((itemSum, item) => itemSum + (item.cost * item.quantity), 0);
        }, 0);

        // Expenses stats
        const dailyExpensesData = await prisma.expense.findMany({
            where: { createdAt: { gte: today } }
        });
        stats.dailyExpenses = dailyExpensesData.reduce((sum, exp) => sum + exp.amount, 0);

        // Aggregate top products
        const topSales = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });

        topProducts = await Promise.all(topSales.map(async (sale: any) => {
            const product = await prisma.product.findUnique({
                where: { id: sale.productId },
                select: { name: true, sku: true }
            });
            return { ...product, totalSold: sale._sum.quantity };
        }));

    } catch (error) {
        console.error("Ma'lumotlar bazasiga ulanishda muammo", error);
    }

    const grossProfit = (stats.dailySales / 1.08) - stats.dailyCOGS; // Subtracting estimated 8% tax first
    const netProfit = grossProfit - stats.dailyExpenses;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Boshqaruv Paneli</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Bugungi biznes holati va moliya tahlili.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <ExportButton />
                    <button className="btn">+ Yangi Tranzaksiya</button>
                </div>
            </header>

            {/* Financial Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Bugungi Savdo</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{stats.dailySales.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{stats.dailyOrders} ta tranzaksiya</div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Yalpi Foyda (Gross)</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--warning)', lineHeight: 1 }}>{Math.max(0, grossProfit).toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>COGS: {stats.dailyCOGS.toLocaleString()} so'm</div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Sof Foyda (Net)</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)', lineHeight: 1 }}>{netProfit.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Xarajatlar: {stats.dailyExpenses.toLocaleString()} so'm</div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--accent-secondary)' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Zaxira Qiymati</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-secondary)', lineHeight: 1 }}>{stats.inventoryValuation.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Kamaygan zaxiralar: {stats.lowStock} ta</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>Haftalik Savdo Dinamikasi</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', padding: '0 1rem', gap: '1rem' }}>
                        {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '100%', height: `${height}%`,
                                    background: i === 4 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                    borderRadius: '4px 4px 0 0'
                                }} />
                                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Yak'][i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Top Mahsulotlar</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {topProducts.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Hali ma'lumot yo'q.</p>
                        ) : (
                            topProducts.map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</div>
                                    </div>
                                    <div style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {p.totalSold} dona
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
