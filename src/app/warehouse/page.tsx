import { prisma } from '@/lib/prisma';
import ExportButton from '@/components/analytics/ExportButton';
import DashboardDateFilter from '@/components/analytics/DashboardDateFilter';
import Link from 'next/link';

export default async function WarehouseDashboard({ searchParams }: { searchParams: Promise<{ period?: string, startDate?: string, endDate?: string, showMoreTop?: string, modal?: string }> }) {
    const params = await searchParams;
    const period = params.period || 'today';
    const showMoreTop = params.showMoreTop === 'true';
    
    const toggleParams = new URLSearchParams();
    if (params.period) toggleParams.set('period', params.period);
    if (params.startDate) toggleParams.set('startDate', params.startDate);
    if (params.endDate) toggleParams.set('endDate', params.endDate);
    if (!showMoreTop) toggleParams.set('showMoreTop', 'true');
    const toggleTopProductsUrl = `/warehouse?${toggleParams.toString()}`;
    
    const showModal = params.modal;
    const closeModalUrl = `/warehouse?${toggleParams.toString()}`;
    // ... existing code ...
    // (Wait, I should be careful not to overwrite the whole file incorrectly)
    // Let's just target the button.
    let stats = { products: 0, categories: 0, lowStock: 0, dailySales: 0, dailyOrders: 0, dailyCOGS: 0, dailyExpenses: 0, inventoryValuation: 0, refundCount: 0, refundAmount: 0 };
    let topProducts: any[] = [];
    let chartSalesData: number[] = [];
    let chartLabels: string[] = [];
    let chartHeights: number[] = [];
    let branchSalesData: { name: string, total: number }[] = [];
    const timeBlocks = ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-24'];
    let heatmapData: Record<string, { name: string, data: number[] }> = {};
    let maxHeatmapValue = 0;

    let dailyOrdersData: any[] = [];
    let inventory: any[] = [];
    let periodExpensesData: any[] = [];
    
    let startD = new Date();
    startD.setHours(0, 0, 0, 0);
    let endD = new Date();
    endD.setHours(23, 59, 59, 999);

    try {

        if (period === 'yesterday') {
            startD.setDate(startD.getDate() - 1);
            endD.setDate(endD.getDate() - 1);
        } else if (period === 'last_week') {
            startD.setDate(startD.getDate() - 7);
        } else if (period === 'last_month') {
            startD.setMonth(startD.getMonth() - 1);
        } else if (period === 'custom' && params.startDate && params.endDate) {
            startD = new Date(params.startDate);
            startD.setHours(0, 0, 0, 0);
            endD = new Date(params.endDate);
            endD.setHours(23, 59, 59, 999);
        }

        stats.products = await prisma.product.count();
        stats.categories = await prisma.category.count();

        // Inventory stats
        inventory = await prisma.inventory.findMany({
            include: { product: true }
        });

        stats.lowStock = inventory.filter(i => i.quantity < 10).length;
        stats.inventoryValuation = inventory.reduce((sum, item) => sum + (item.product.cost * item.quantity), 0);

        // Sales stats
        dailyOrdersData = await prisma.order.findMany({
            where: {
                createdAt: { gte: startD, lte: endD },
                status: 'COMPLETED'
            },
            include: { items: true }
        });

        stats.dailySales = dailyOrdersData.reduce((acc, curr) => acc + curr.totalAmount, 0);
        stats.dailyOrders = dailyOrdersData.length;

        // Refund stats
        const refundOrdersData = await prisma.order.findMany({
            where: {
                createdAt: { gte: startD, lte: endD },
                status: 'REFUNDED'
            }
        });
        stats.refundCount = refundOrdersData.length;
        stats.refundAmount = refundOrdersData.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);

        // COGS Calculation
        stats.dailyCOGS = dailyOrdersData.reduce((sum, order) => {
            return sum + (order.items as any[]).reduce((itemSum, item) => itemSum + (item.cost * item.quantity), 0);
        }, 0);

        // Expenses stats
        const fixedCategories = ['rent', 'ijara', 'salary', 'maosh', 'utility', 'kommunal'];
        const expenseDiffTime = Math.abs(endD.getTime() - startD.getTime());
        const expenseDiffDays = Math.max(1, Math.ceil(expenseDiffTime / (1000 * 60 * 60 * 24)));
        
        periodExpensesData = await prisma.expense.findMany({
            where: { createdAt: { gte: startD, lte: endD } }
        });
        
        const variableSum = periodExpensesData
            .filter(exp => !fixedCategories.includes(exp.category.toLowerCase().trim()))
            .reduce((sum, exp) => sum + exp.amount, 0);

        // Fetch fixed expenses for the month of startD
        const monthStart = new Date(startD.getFullYear(), startD.getMonth(), 1);
        const monthEnd = new Date(startD.getFullYear(), startD.getMonth() + 1, 0, 23, 59, 59, 999);
        const daysInMonth = monthEnd.getDate();

        const monthlyFixedData = await prisma.expense.findMany({
            where: { createdAt: { gte: monthStart, lte: monthEnd } }
        });

        const fixedSum = monthlyFixedData
            .filter(exp => fixedCategories.includes(exp.category.toLowerCase().trim()))
            .reduce((sum, exp) => sum + exp.amount, 0);

        const allocatedFixedExpense = (fixedSum / daysInMonth) * expenseDiffDays;
        stats.dailyExpenses = variableSum + allocatedFixedExpense;

        // Aggregate top products
        const topSales = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                createdAt: { gte: startD, lte: endD }
            },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: showModal === 'top_products' ? 50 : 5,
        });

        topProducts = await Promise.all(topSales.map(async (sale: any) => {
            const product = await prisma.product.findUnique({
                where: { id: sale.productId },
                select: { name: true, sku: true }
            });
            return { ...product, totalSold: sale._sum.quantity };
        }));

        // Dynamic Sales Chart based on period
        const diffTime = Math.abs(endD.getTime() - startD.getTime());
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        const periodOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startD, lte: endD },
                status: 'COMPLETED'
            },
            select: { totalAmount: true, createdAt: true, branchId: true }
        });

        if (diffDays <= 1) {
            // Hourly: group by 3-hour blocks (8 blocks)
            chartSalesData = Array(8).fill(0);
            chartLabels = ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-24'];
            
            periodOrders.forEach(o => {
                const hour = o.createdAt.getHours();
                const blockIndex = Math.floor(hour / 3);
                if (blockIndex >= 0 && blockIndex < 8) {
                    chartSalesData[blockIndex] += o.totalAmount;
                }
            });
        } else if (diffDays <= 31) {
            // Daily
            chartSalesData = Array(diffDays).fill(0);
            chartLabels = Array(diffDays).fill('');
            
            for (let i = 0; i < diffDays; i++) {
                const d = new Date(startD);
                d.setDate(d.getDate() + i);
                chartLabels[i] = `${d.getDate()}/${d.getMonth()+1}`;
                
                const dStart = new Date(d);
                dStart.setHours(0, 0, 0, 0);
                const dEnd = new Date(d);
                dEnd.setHours(23, 59, 59, 999);
                
                chartSalesData[i] = periodOrders
                    .filter(o => o.createdAt >= dStart && o.createdAt <= dEnd)
                    .reduce((sum, o) => sum + o.totalAmount, 0);
            }
        } else {
            // Monthly
            const startMonth = startD.getMonth();
            const startYear = startD.getFullYear();
            const endMonth = endD.getMonth();
            const endYear = endD.getFullYear();
            const diffMonths = Math.max(1, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
            
            chartSalesData = Array(diffMonths).fill(0);
            chartLabels = Array(diffMonths).fill('');
            
            for (let i = 0; i < diffMonths; i++) {
                const d = new Date(startYear, startMonth + i, 1);
                chartLabels[i] = `${d.getMonth()+1}/${d.getFullYear()}`;
                
                const dStart = new Date(d);
                const dEnd = new Date(startYear, startMonth + i + 1, 0, 23, 59, 59, 999);
                
                chartSalesData[i] = periodOrders
                    .filter(o => o.createdAt >= dStart && o.createdAt <= dEnd)
                    .reduce((sum, o) => sum + o.totalAmount, 0);
            }
        }

        const maxChartSale = Math.max(...chartSalesData, 1);
        chartHeights = chartSalesData.map(val => (val / maxChartSale) * 100);

        // Branch Sales Dynamics
        const branchSalesRaw = await prisma.order.groupBy({
            by: ['branchId'],
            where: {
                createdAt: { gte: startD, lte: endD },
                status: 'COMPLETED'
            },
            _sum: { totalAmount: true }
        });

        const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
        const branchMap = new Map(branches.map(b => [b.id, b.name]));

        branchSalesData = branchSalesRaw.map(bs => ({
            name: bs.branchId && branchMap.has(bs.branchId) ? branchMap.get(bs.branchId)! : 'Asosiy filial',
            total: bs._sum.totalAmount || 0
        })).sort((a, b) => b.total - a.total);

        // Heatmap Logic
        branches.forEach(b => {
            heatmapData[b.id] = { name: b.name, data: Array(8).fill(0) };
        });
        heatmapData['unknown'] = { name: 'Asosiy filial', data: Array(8).fill(0) };

        periodOrders.forEach(o => {
            const hour = o.createdAt.getHours();
            const blockIndex = Math.floor(hour / 3);
            const branchKey = o.branchId && branchMap.has(o.branchId) ? o.branchId : 'unknown';
            
            if (blockIndex >= 0 && blockIndex < 8) {
                heatmapData[branchKey].data[blockIndex] += o.totalAmount;
            }
        });

        // Filter out empty branches and find max
        Object.values(heatmapData).forEach(branch => {
            branch.data.forEach(val => {
                if (val > maxHeatmapValue) maxHeatmapValue = val;
            });
        });
        
        heatmapData = Object.fromEntries(
            Object.entries(heatmapData).filter(([_, b]) => b.data.some(val => val > 0))
        );
        if (Object.keys(heatmapData).length === 0) {
            heatmapData['unknown'] = { name: 'Asosiy filial', data: Array(8).fill(0) };
        }

    } catch (error) {
        console.error("Ma'lumotlar bazasiga ulanishda muammo", error);
    }

    const grossProfit = (stats.dailySales / 1.08) - stats.dailyCOGS; // Subtracting estimated 8% tax first
    const netProfit = grossProfit - stats.dailyExpenses;

    const periodLabels: Record<string, string> = {
        today: 'Bugungi',
        yesterday: 'Kechagi',
        last_week: 'Oxirgi 7 kunlik',
        last_month: 'Oxirgi 30 kunlik',
        custom: 'Tanlangan davrdagi'
    };
    const periodLabel = periodLabels[period] || 'Bugungi';
    
    const filterQuery = `period=${period}${period === 'custom' ? `&startDate=${params.startDate}&endDate=${params.endDate}` : ''}`;
    const getModalUrl = (type: string) => `/warehouse?${filterQuery}&modal=${type}`;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Boshqaruv Paneli</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Biznes holati va moliya tahlili.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <DashboardDateFilter />
                    <ExportButton />
                    <button className="btn">+ Yangi Tranzaksiya</button>
                </div>
            </header>

            {/* Financial Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <Link href={getModalUrl('sales')} className="card" style={{ borderLeft: '4px solid var(--accent-primary)', display: 'block' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>{periodLabel} Savdo</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{stats.dailySales.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{stats.dailyOrders} ta tranzaksiya</div>
                </Link>

                <Link href={getModalUrl('gross')} className="card" style={{ borderLeft: '4px solid var(--warning)', display: 'block' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Yalpi Foyda (Gross)</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--warning)', lineHeight: 1 }}>{Math.max(0, grossProfit).toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>COGS: {stats.dailyCOGS.toLocaleString()} so'm</div>
                </Link>

                <Link href={getModalUrl('net')} className="card" style={{ borderLeft: '4px solid var(--success)', display: 'block' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Sof Foyda (Net)</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)', lineHeight: 1 }}>{netProfit.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Xarajatlar: {stats.dailyExpenses.toLocaleString()} so'm</div>
                </Link>

                <Link href={getModalUrl('inventory')} className="card" style={{ borderLeft: '4px solid var(--accent-secondary)', display: 'block' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Zaxira Qiymati</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-secondary)', lineHeight: 1 }}>{stats.inventoryValuation.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Kamaygan zaxiralar: {stats.lowStock} ta</div>
                </Link>

                <Link href={getModalUrl('refunds')} className="card" style={{ borderLeft: '4px solid var(--danger)', display: 'block' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>{periodLabel} Vozvratlar</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--danger)', lineHeight: 1 }}>{stats.refundAmount.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{stats.refundCount} ta tranzaksiya</div>
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="card" style={{ overflowX: 'auto' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>Savdo Dinamikasi</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', padding: '0 1rem', gap: chartHeights.length > 15 ? '2px' : '0.5rem', minWidth: chartHeights.length > 15 ? `${chartHeights.length * 30}px` : '100%' }}>
                        {chartHeights.map((height, i) => (
                            <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} title={`${chartSalesData[i].toLocaleString()} so'm`}>
                                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                    <div style={{
                                        width: '100%', height: `${Math.max(height, 5)}%`,
                                        background: i === chartHeights.length - 1 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.5s ease'
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.625rem', color: i === chartHeights.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === chartHeights.length - 1 ? 'bold' : 'normal', flexShrink: 0, whiteSpace: 'nowrap' }}>{chartLabels[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Top Mahsulotlar</h3>
                        <Link href={getModalUrl('top_products')} scroll={false} style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                            Ko'proq ko'rsatish ↓
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {topProducts.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Hali ma'lumot yo'q.</p>
                        ) : (
                            topProducts.slice(0, 5).map((p, i) => (
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

            {/* Branch Sales Dynamics */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Filiallar Bo'yicha Savdo</h3>
                {branchSalesData.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Hali ma'lumot yo'q.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(() => {
                            const maxBranchSale = Math.max(...branchSalesData.map(b => b.total), 1);
                            return branchSalesData.map((branch, i) => {
                                const widthPercent = (branch.total / maxBranchSale) * 100;
                                return (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                            <span style={{ fontWeight: 600 }}>{branch.name}</span>
                                            <span>{branch.total.toLocaleString()} so'm</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${widthPercent}%`, 
                                                height: '100%', 
                                                background: i === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)', 
                                                transition: 'width 0.5s ease' 
                                            }} />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>

            {/* Branch Active Hours Heatmap */}
            <div className="card" style={{ marginTop: '2rem', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Filiallar Faollik Vaqti</h3>
                <div style={{ minWidth: '600px' }}>
                    {/* Header Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(8, 1fr)', gap: '4px', marginBottom: '8px' }}>
                        <div></div>
                        {timeBlocks.map((block, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{block}</div>
                        ))}
                    </div>
                    {/* Rows */}
                    {Object.values(heatmapData).map((branch, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '150px repeat(8, 1fr)', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={branch.name}>{branch.name}</div>
                            {branch.data.map((val, i) => {
                                const intensity = maxHeatmapValue > 0 ? (val / maxHeatmapValue) : 0;
                                const opacity = intensity === 0 ? 0.05 : Math.max(0.15, intensity);
                                return (
                                    <div 
                                        key={i} 
                                        title={`${branch.name}: ${timeBlocks[i]} - ${val.toLocaleString()} so'm`}
                                        style={{ 
                                            height: '40px', 
                                            borderRadius: '4px', 
                                            backgroundColor: `rgba(59, 130, 246, ${opacity})`, 
                                            border: intensity > 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer'
                                        }} 
                                        className="chart-bar"
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Metric Breakdown Modals */}
            {showModal && (
                <div style={{ 
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', 
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', zIndex: 2000, padding: '1rem' 
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>
                                {showModal === 'sales' && "Savdo Tafsilotlari"}
                                {showModal === 'refunds' && "Vozvrat Tafsilotlari"}
                                {showModal === 'gross' && "Yalpi Foyda Hisob-kitobi"}
                                {showModal === 'net' && "Sof Foyda Hisob-kitobi"}
                                {showModal === 'inventory' && "Zaxira Qiymati Tafsilotlari"}
                                {showModal === 'top_products' && "Eng Ko'p Sotilgan Mahsulotlar"}
                            </h2>
                            <Link href={closeModalUrl} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', textDecoration: 'none' }}>&times;</Link>
                        </div>

                        {showModal === 'sales' && (
                            <div>
                                <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>To'lov turlari bo'yicha:</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>Naqd: <strong>{dailyOrdersData.reduce((sum, o) => sum + o.cashAmount, 0).toLocaleString()} so'm</strong></div>
                                        <div>Karta: <strong>{dailyOrdersData.reduce((sum, o) => sum + o.cardAmount, 0).toLocaleString()} so'm</strong></div>
                                        <div>Click: <strong>{dailyOrdersData.reduce((sum, o) => sum + o.clickAmount, 0).toLocaleString()} so'm</strong></div>
                                        <div>Vozvrat: <strong style={{ color: 'var(--danger)' }}>{stats.refundAmount.toLocaleString()} so'm</strong></div>
                                        <div style={{ gridColumn: 'span 2' }}>Chegirma: <strong>{dailyOrdersData.reduce((sum, o) => sum + o.discount, 0).toLocaleString()} so'm</strong></div>
                                    </div>
                                </div>
                                <h4 style={{ marginBottom: '1rem' }}>Oxirgi tranzaksiyalar:</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {dailyOrdersData.slice(0, 10).map((order, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                            <span>{order.createdAt.toLocaleTimeString()}</span>
                                            <span style={{ fontWeight: 600 }}>{order.totalAmount.toLocaleString()} so'm</span>
                                        </div>
                                    ))}
                                    {dailyOrdersData.length > 10 && <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Va yana {dailyOrdersData.length - 10} ta tranzaksiya...</p>}
                                </div>
                            </div>
                        )}

                        {showModal === 'refunds' && (
                            <div>
                                <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tanlangan davrdagi vozvratlar:</p>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{stats.refundAmount.toLocaleString()} so'm</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{stats.refundCount} ta tranzaksiya</div>
                                </div>
                                <h4 style={{ marginBottom: '1rem' }}>Oxirgi vozvratlar:</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {(await prisma.order.findMany({
                                        where: { status: 'REFUNDED', createdAt: { gte: startD, lte: endD } },
                                        orderBy: { createdAt: 'desc' },
                                        take: 20
                                    })).map((order: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                            <span>{order.createdAt.toLocaleTimeString()}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{order.totalAmount.toLocaleString()} so'm</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showModal === 'gross' && (
                            <div>
                                <div style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                                        <span>Jami Savdo:</span>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{stats.dailySales.toLocaleString()} so'm</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                                        <span>Tan narxi (COGS):</span>
                                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>- {stats.dailyCOGS.toLocaleString()} so'm</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', fontWeight: 800, fontSize: '1.25rem' }}>
                                        <span>Yalpi Foyda:</span>
                                        <span style={{ color: 'var(--warning)' }}>{grossProfit.toLocaleString()} so'm</span>
                                    </div>
                                </div>
                                <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    * Yalpi foyda jami sotilgan mahsulotlar summasidan ularning omborga kirish narxi (COGS) ayirilgan qoldiqdir.
                                </p>
                            </div>
                        )}

                        {showModal === 'net' && (
                            <div>
                                <div style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                                        <span>Yalpi Foyda:</span>
                                        <span style={{ fontWeight: 700 }}>{grossProfit.toLocaleString()} so'm</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                                        <span>Xarajatlar (jami):</span>
                                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>- {stats.dailyExpenses.toLocaleString()} so'm</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', fontWeight: 800, fontSize: '1.25rem' }}>
                                        <span>Sof Foyda:</span>
                                        <span style={{ color: 'var(--success)' }}>{netProfit.toLocaleString()} so'm</span>
                                    </div>
                                </div>
                                <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Xarajatlar tarkibi:</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                        <span>Oylik/Ijara (taqsimlangan):</span>
                                        <span>{(stats.dailyExpenses - periodExpensesData.filter(e => !['rent', 'ijara', 'salary', 'maosh', 'utility', 'kommunal'].includes(e.category.toLowerCase().trim())).reduce((s, e) => s + e.amount, 0)).toLocaleString()} so'm</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                        <span>Kundalik xarajatlar:</span>
                                        <span>{periodExpensesData.filter(e => !['rent', 'ijara', 'salary', 'maosh', 'utility', 'kommunal'].includes(e.category.toLowerCase().trim())).reduce((s, e) => s + e.amount, 0).toLocaleString()} so'm</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showModal === 'inventory' && (
                            <div>
                                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Eng yuqori qiymatga ega mahsulotlar:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {inventory
                                        .map(i => ({ name: i.product.name, value: i.product.cost * i.quantity, qty: i.quantity }))
                                        .sort((a, b) => b.value - a.value)
                                        .slice(0, 10)
                                        .map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qoldiq: {item.qty} dona</div>
                                                </div>
                                                <span style={{ fontWeight: 700 }}>{item.value.toLocaleString()} so'm</span>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                    <span>Jami Zaxira Qiymati:</span>
                                    <span>{stats.inventoryValuation.toLocaleString()} so'm</span>
                                </div>
                            </div>
                        )}

                        {showModal === 'top_products' && (
                            <div>
                                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Tanlangan davrda eng ko'p sotilgan mahsulotlar (top 50):</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {topProducts.map((p, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</div>
                                            </div>
                                            <div style={{ padding: '0.25rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 700 }}>
                                                {p.totalSold} dona
                                            </div>
                                        </div>
                                    ))}
                                    {topProducts.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Ma'lumot topilmadi.</p>}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '2rem' }}>
                            <Link href={closeModalUrl} className="btn btn-secondary" style={{ width: '100%' }}>Yopish</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
