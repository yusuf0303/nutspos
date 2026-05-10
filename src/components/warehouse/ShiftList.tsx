'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ShiftList({ initialShifts }: { initialShifts: any[] }) {
    const [shifts] = useState(initialShifts);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OPEN':
                return { background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' };
            case 'CLOSED':
                return { background: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-muted)' };
            default:
                return {};
        }
    };

    return (
        <div className="card">
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Barcha Smenalar</h2>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>Xodim</th>
                            <th style={{ padding: '1rem' }}>Filial</th>
                            <th style={{ padding: '1rem' }}>Ochilgan vaqt</th>
                            <th style={{ padding: '1rem' }}>Yopilgan vaqt</th>
                            <th style={{ padding: '1rem' }}>Boshlang'ich pul</th>
                            <th style={{ padding: '1rem' }}>Yakuniy pul</th>
                            <th style={{ padding: '1rem' }}>Farq</th>
                            <th style={{ padding: '1rem' }}>Holat</th>
                            <th style={{ padding: '1rem' }}>Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.map((shift) => {
                            const diff = shift.status === 'CLOSED' ? (shift.endingCash - (shift.expectedCash || 0)) : null;
                            
                            return (
                                <tr key={shift.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{shift.id.slice(-6)}</td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{shift.user?.name}</td>
                                    <td style={{ padding: '1rem' }}>{shift.branch?.name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        {new Date(shift.startTime).toLocaleDateString()} <br />
                                        <span style={{ color: 'var(--text-muted)' }}>{new Date(shift.startTime).toLocaleTimeString()}</span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                        {shift.endTime ? (
                                            <>
                                                {new Date(shift.endTime).toLocaleDateString()} <br />
                                                <span style={{ color: 'var(--text-muted)' }}>{new Date(shift.endTime).toLocaleTimeString()}</span>
                                            </>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{shift.startingCash.toLocaleString()}</td>
                                    <td style={{ padding: '1rem' }}>{shift.endingCash ? shift.endingCash.toLocaleString() : '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {diff !== null ? (
                                            <span style={{ color: diff < 0 ? 'var(--danger)' : diff > 0 ? 'var(--success)' : 'inherit', fontWeight: 700 }}>
                                                {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, ...getStatusStyle(shift.status) }}>
                                            {shift.status === 'OPEN' ? 'OCHIQ' : 'YOPILGAN'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/warehouse/shifts/${shift.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                                            👁 Ko'rish
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {shifts.length === 0 && (
                            <tr>
                                <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Smenalar mavjud emas</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
