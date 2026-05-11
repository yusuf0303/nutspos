'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function InventoryList({ summary, branches, pendingAdjustments }: { summary: any[], branches: any[], pendingAdjustments: any[] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSummary = summary.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const iStyle = { padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '100%', maxWidth: '300px' };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Inventar Nazorati</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Filiallar bo'yicha qoldiqlarni kuzatib boring.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/warehouse/inventory/adjustments/new" className="btn">
                        + Yangi Inventarizatsiya
                    </Link>
                </div>
            </header>

            {/* Pending Adjustments Section */}
            {pendingAdjustments.length > 0 && (
                <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--warning)', background: 'rgba(245, 158, 11, 0.05)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⏳ Yakunlanmagan Hujjatlar ({pendingAdjustments.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {pendingAdjustments.map(adj => (
                            <Link key={adj.id} href={`/warehouse/inventory/adjustments/${adj.id}`} style={{ textDecoration: 'none' }}>
                                <div className="card table-row-hover" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>INV-{adj.id.slice(-6).toUpperCase()}</div>
                                    <div style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>Filial: <b>{adj.branch.name}</b></div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {new Date(adj.createdAt).toLocaleDateString()} | {adj.user.name}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <input 
                    type="text" 
                    placeholder="Mahsulot qidirish (nomi yoki SKU)..." 
                    style={iStyle}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Mahsulot SKU / Nomi</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Kategoriya</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, textAlign: 'center' }}>Jami Qoldiq</th>
                            {branches.map(b => (
                                <th key={b.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, textAlign: 'center' }}>
                                    {b.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSummary.length === 0 ? (
                            <tr><td colSpan={3 + branches.length} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Ma'lumot topilmadi</td></tr>
                        ) : (
                            filteredSummary.map((item: any) => (
                                <tr key={item.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.sku}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.category}</span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: item.totalStock < 10 ? 'var(--warning)' : 'var(--success)' }}>
                                            {item.totalStock} {item.unit}
                                        </div>
                                    </td>
                                    {branches.map(b => {
                                        const bStock = item.branchStock.find((s: any) => s.branchId === b.id)?.quantity || 0;
                                        return (
                                            <td key={b.id} style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontWeight: 600, 
                                                    color: bStock === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                                    opacity: bStock === 0 ? 0.5 : 1
                                                }}>
                                                    {bStock}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
