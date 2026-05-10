'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [period, setPeriod] = useState(searchParams.get('period') || 'today');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

    useEffect(() => {
        // Update local state if URL changes
        setPeriod(searchParams.get('period') || 'today');
        setStartDate(searchParams.get('startDate') || '');
        setEndDate(searchParams.get('endDate') || '');
    }, [searchParams]);

    const handleApply = (newPeriod: string, start?: string, end?: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('period', newPeriod);
        
        if (newPeriod === 'custom') {
            if (start && end) {
                params.set('startDate', start);
                params.set('endDate', end);
            }
        } else {
            params.delete('startDate');
            params.delete('endDate');
        }
        
        router.push(`/warehouse?${params.toString()}`);
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', animation: 'fadeIn 0.3s ease-out' }}>
            <select 
                value={period} 
                onChange={(e) => {
                    const val = e.target.value;
                    setPeriod(val);
                    if (val !== 'custom') {
                        handleApply(val);
                    }
                }}
                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
                <option value="today">Bugun</option>
                <option value="yesterday">Kecha</option>
                <option value="last_week">Oxirgi 7 kun</option>
                <option value="last_month">Oxirgi 30 kun</option>
                <option value="custom">Boshqa muddat</option>
            </select>

            {period === 'custom' && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', colorScheme: 'dark' }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', colorScheme: 'dark' }}
                    />
                    <button 
                        onClick={() => handleApply('custom', startDate, endDate)}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        disabled={!startDate || !endDate}
                    >
                        Filtrlash
                    </button>
                </div>
            )}
        </div>
    );
}
