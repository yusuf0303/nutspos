'use client';

import { receivePurchaseOrder } from '@/app/actions/purchaseActions';
import { useToast } from '@/context/ToastContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReceivePOButton({ poId, status }: { poId: string, status: string }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReceive = async () => {
        if (!confirm("Barcha mahsulotlarni qabul qilib, omborga kirim qilmoqchimisiz?")) return;

        setLoading(true);
        const result = await receivePurchaseOrder(poId);
        setLoading(false);

        if (result.success) {
            showToast("Mahsulotlar omborga qabul qilindi", "success");
            router.refresh();
        } else {
            showToast("Xato: " + result.error, "error");
        }
    };

    if (status === 'RECEIVED') return null;

    return (
        <button
            className="btn"
            disabled={loading}
            onClick={handleReceive}
            style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.8125rem',
                background: 'var(--success)',
                borderColor: 'rgba(16, 185, 129, 0.2)',
                opacity: loading ? 0.5 : 1
            }}
        >
            {loading ? "Yuklanmoqda..." : "Qabul Qilish"}
        </button>
    );
}
