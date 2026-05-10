'use client';

import { deleteProduct } from '@/app/actions/productActions';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

export default function ProductActionButtons({ productId }: { productId: string }) {
    const { showToast } = useToast();
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm("Ushbu mahsulotni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) {
            const res = await deleteProduct(productId);
            if (res.success) {
                showToast("Mahsulot muvaffaqiyatli o'chirildi", "success");
                router.refresh();
            } else {
                showToast("Xato: " + res.error, "error");
            }
        }
    };

    return (
        <>
            <a
                href={`/warehouse/products/${productId}/edit`}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
                Tahrirlash
            </a>
            <button
                onClick={handleDelete}
                style={{
                    padding: '0.5rem 1rem', fontSize: '0.875rem',
                    background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                    border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                O'chirish
            </button>
        </>
    );
}
