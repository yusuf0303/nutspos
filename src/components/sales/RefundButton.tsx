'use client';

import { refundOrder } from '@/app/actions/orderActions';
import { useToast } from '@/context/ToastContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefundButton({ orderId, status }: { orderId: string, status: string }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRefund = async () => {
        if (!confirm("Haqiqatan ham ushbu buyurtmani vozvrat qilmoqchimisiz? Zaxiralar qayta tiklanadi.")) return;

        setLoading(true);
        const result = await refundOrder(orderId);
        setLoading(false);

        if (result.success) {
            showToast("Buyurtma muvaffaqiyatli vozvrat qilindi", "success");
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    if (status === 'REFUNDED' || status === 'CANCELLED') return (
        <div style={{ color: 'var(--danger)', fontWeight: 700, textAlign: 'center', marginTop: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
            VOZVRAT QILINGAN
        </div>
    );

    return (
        <button
            className="btn btn-secondary"
            disabled={loading}
            onClick={handleRefund}
            style={{
                width: '100%',
                marginTop: '1rem',
                color: 'var(--danger)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                opacity: loading ? 0.5 : 1,
                fontWeight: 600
            }}
        >
            {loading ? "Vozvrat qilinmoqda..." : "♻️ Buyurtmani Vozvrat Qilish"}
        </button>
    );
}
