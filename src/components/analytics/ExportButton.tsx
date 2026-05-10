'use client';

import { exportSalesToCSV } from '@/app/actions/exportActions';
import { useToast } from '@/context/ToastContext';
import { useState } from 'react';

export default function ExportButton({ data, filename, type }: { data: any[], filename: string, type: 'CSV' | 'PDF' }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const result = await exportSalesToCSV();

            if (result.success && result.data) {
                const blob = new Blob([result.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `savdo_hisoboti_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                showToast("Eksport qilishda xatolik: " + result.error, "error");
            }
        } catch (error: any) {
            showToast("Eksport qilishda xatolik: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            className="btn btn-secondary"
            disabled={loading}
        >
            {loading ? "Tayyorlanmoqda..." : "📥 Hisobotni Yuklash (.csv)"}
        </button>
    );
}
