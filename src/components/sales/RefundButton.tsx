'use client';

import { cancelOrder } from '@/app/actions/orderActions';
import { useToast } from '@/context/ToastContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefundButton({ orderId, status }: { orderId: string, status: string }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRefund = async () => {
        if (!confirm("Haqiqatan ham bu buyurtmani bekor qilmoqchimisiz? Zaxiralar qayta tiklanadi.")) return;

        setLoading(true);
        const result = await cancelOrder(orderId);
        setLoading(false);

        if (result.success) {
            showToast("Buyurtma muvaffaqiyatli bekor qilindi", "success");
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    if (status === 'CANCELLED') return null;

    return (
        <button
            className="btn btn-secondary"
            disabled={loading}
            onClick={handleRefund}
            style={{
                width: '100%',
                marginTop: '2rem',
                color: 'var(--danger)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                opacity: loading ? 0.5 : 1
            }}
        >
            {loading ? "Bekor qilinmoqda..." : "Buyurtmani Bekor Qilish"}
        </button>
    );
}
