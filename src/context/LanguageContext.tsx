'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    uz: {
        dashboard: "Boshqaruv Paneli",
        products: "Mahsulotlar",
        categories: "Kategoriyalar va Yetkazib Beruvchilar",
        inventory: "Inventar Nazorati",
        sales: "Savdo va Analitika",
        customers: "Mijozlar",
        openPos: "POSni Ochish",
        warehouseSystem: "Ombor Tizimi",
        branches: "Filiallar",
        employees: "Xodimlar",
        shifts: "Kassa Smenalari",
        loading: "Yuklanmoqda...",
        search: "Qidirish...",
        add: "Qo'shish",
        edit: "Tahrirlash",
        delete: "O'chirish",
        save: "Saqlash",
        cancel: "Bekor qilish",
        back: "Orqaga",
        total: "Jami",
        currency: "so'm",
    },
    en: {
        dashboard: "Dashboard",
        products: "Products",
        categories: "Categories & Suppliers",
        inventory: "Inventory Control",
        sales: "Sales & Analytics",
        customers: "Customers",
        openPos: "Open POS",
        warehouseSystem: "Warehouse System",
        branches: "Branches",
        employees: "Employees",
        shifts: "Cash Shifts",
        loading: "Loading...",
        search: "Search...",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        back: "Back",
        total: "Total",
        currency: "USD",
    }
};

type Language = 'uz' | 'en';

const LanguageContext = createContext<{
    lang: Language;
    setLang: (l: Language) => void;
    t: (key: keyof typeof translations['uz']) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Language>('uz');

    const t = (key: keyof typeof translations['uz']) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within LanguageProvider");
    return context;
}
