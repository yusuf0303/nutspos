'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import RefundButton from '../sales/RefundButton';

export default function ShiftDetail({ shift, backUrl = '/warehouse/shifts' }: { shift: any, backUrl?: string }) {
    const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

    const toggleOrder = (orderId: string) => {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };
    const completedOrders = shift.orders.filter((o: any) => o.status === 'COMPLETED');
    const refundedOrders = shift.orders.filter((o: any) => o.status === 'REFUNDED');

    const stats = {
        total: completedOrders.reduce((acc: number, o: any) => acc + o.totalAmount, 0),
        cash: completedOrders.reduce((acc: number, o: any) => acc + o.cashAmount, 0),
        card: completedOrders.reduce((acc: number, o: any) => acc + o.cardAmount, 0),
        click: completedOrders.reduce((acc: number, o: any) => acc + o.clickAmount, 0),
        refundCount: refundedOrders.length,
        refundTotal: refundedOrders.reduce((acc: number, o: any) => acc + o.totalAmount, 0),
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link href={backUrl} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>← Smenalar ro'yxatiga qaytish</Link>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>Smena Tafsilotlari: #{shift.id.slice(-6)}</h1>
                </div>
                <div style={{ padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 700, background: shift.status === 'OPEN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)', color: shift.status === 'OPEN' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {shift.status === 'OPEN' ? 'OCHIQ' : 'YOPILGAN'}
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Jami Savdo</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.total.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></div>
                </div>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Naqd pul</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>{stats.cash.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></div>
                </div>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Plastik karta</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{stats.card.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></div>
                </div>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Click / Payme</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{stats.click.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></div>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '5px solid var(--danger)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Vozvratlar</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger)' }}>{stats.refundCount} ta / {stats.refundTotal.toLocaleString()} <span style={{ fontSize: '1rem' }}>so'm</span></div>
                </div>
            </div>

            {/* Shift Info */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem' }}>Smena ma'lumotlari</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mas'ul xodim:</div>
                        <div style={{ fontWeight: 600 }}>{shift.user?.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filial:</div>
                        <div style={{ fontWeight: 600 }}>{shift.branch?.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vaqt oralig'i:</div>
                        <div style={{ fontWeight: 600 }}>
                            {new Date(shift.startTime).toLocaleString()} - {shift.endTime ? new Date(shift.endTime).toLocaleString() : 'Davom etmoqda...'}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Boshlang'ich kassa:</div>
                        <div style={{ fontWeight: 600 }}>{shift.startingCash.toLocaleString()} so'm</div>
                    </div>
                    {shift.status === 'CLOSED' && (
                        <>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Yakuniy kassa (kassir):</div>
                                <div style={{ fontWeight: 600 }}>{shift.endingCash?.toLocaleString()} so'm</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kutilayotgan naqd:</div>
                                <div style={{ fontWeight: 600 }}>{shift.expectedCash?.toLocaleString()} so'm</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Orders Table */}
            <div className="card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0 }}>Urilgan Cheklar (Savdolar)</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                                <th style={{ padding: '1rem' }}>Vaqt</th>
                                <th style={{ padding: '1rem' }}>Mijoz</th>
                                <th style={{ padding: '1rem' }}>Jami Summa</th>
                                <th style={{ padding: '1rem' }}>Naqd</th>
                                <th style={{ padding: '1rem' }}>Karta</th>
                                <th style={{ padding: '1rem' }}>Click</th>
                                <th style={{ padding: '1rem' }}>Holat</th>
                                <th style={{ padding: '1rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {shift.orders.map((order: any) => (
                                <Fragment key={order.id}>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => toggleOrder(order.id)}>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleTimeString()}</td>
                                        <td style={{ padding: '1rem' }}>{order.customer?.name || 'Mijozsiz'}</td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{order.totalAmount.toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: 'var(--success)' }}>{order.cashAmount.toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: 'var(--accent-primary)' }}>{order.cardAmount.toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: 'var(--accent-secondary)' }}>{order.clickAmount.toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: order.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: order.status === 'COMPLETED' ? 'var(--success)' : 'var(--danger)' }}>
                                                {order.status === 'COMPLETED' ? 'MUVAFFAQIYATLI' : order.status === 'REFUNDED' ? 'VOZVRAT QILINGAN' : 'BEKOR QILINGAN'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '1.25rem' }}>
                                            {expandedOrders[order.id] ? '−' : '+'}
                                        </td>
                                    </tr>
                                    {expandedOrders[order.id] && (
                                        <tr style={{ background: 'var(--bg-tertiary)' }}>
                                            <td colSpan={8} style={{ padding: '1rem 2rem' }}>
                                                <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                        <div>
                                                            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Sotilgan mahsulotlar:</h4>
                                                            <div style={{ width: '200px', marginTop: '0.5rem' }}>
                                                                <RefundButton orderId={order.id} status={order.status} />
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                                                            {order.discount > 0 && <div style={{ color: 'var(--danger)' }}>Chegirma: -{order.discount.toLocaleString()} so'm</div>}
                                                            {order.cashbackUsed > 0 && <div style={{ color: 'var(--accent-primary)' }}>Keshbek: -{order.cashbackUsed.toLocaleString()} so'm</div>}
                                                        </div>
                                                    </div>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nomi</th>
                                                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Soni</th>
                                                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Narxi</th>
                                                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Chegirma</th>
                                                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Jami</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {order.items.map((item: any) => (
                                                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                    <td style={{ padding: '0.5rem' }}>{item.product?.name}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.quantity} {item.product?.unit || 'ta'}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.price.toLocaleString()}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--danger)' }}>
                                                                        {item.discount > 0 ? `-${item.discount.toLocaleString()}` : '-'}
                                                                    </td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                                                                        {((item.quantity * item.price) - (item.discount || 0)).toLocaleString()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                            {shift.orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Ushbu smenada hali savdo qilinmagan</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
