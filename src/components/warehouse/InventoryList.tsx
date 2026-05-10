'use client';

import { useState } from 'react';
import InventoryAdjustmentModal from '@/components/warehouse/InventoryAdjustmentModal';

export default function InventoryList({ initialInventory }: { initialInventory: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const handleAdjust = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Inventar Nazorati</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Turli manzillardagi zaxira darajalarini kuzatib boring va o'zgartiring.</p>
                </div>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Mahsulot SKU / Nomi</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Manzil</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Joriy Miqdor</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, textAlign: 'right' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialInventory.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Inventar yozuvlari topilmadi</td></tr>
                        ) : (
                            initialInventory.map((inv: any) => (
                                <tr key={inv.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{inv.product?.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{inv.product?.sku}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.375rem 0.75rem',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--accent-primary)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            border: '1px solid rgba(59, 130, 246, 0.2)'
                                        }}>
                                            📍 {inv.location}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                            fontWeight: 700, fontSize: '1.125rem',
                                            color: inv.quantity < 10 ? 'var(--warning)' : 'var(--success)'
                                        }}>
                                            {inv.quantity < 10 && '⚠️'} {inv.quantity} {inv.product?.unit || 'dona'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleAdjust(inv)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                        >
                                            To'g'irlash
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <InventoryAdjustmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                inventoryItem={selectedItem}
            />
        </div>
    );
}
