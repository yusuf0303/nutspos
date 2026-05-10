import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)
    console.log('🌱 Ma\'lumotlar bazasi to\'ldirilmoqda...')

    // 1. Users
    const admin = await prisma.user.upsert({
        where: { email: 'admin@nexus.com' },
        update: {},
        create: {
            email: 'admin@nexus.com',
            name: 'Super Admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
        },
    })

    await prisma.user.upsert({
        where: { email: 'cashier@nexus.com' },
        update: {},
        create: {
            email: 'cashier@nexus.com',
            name: 'Kassir Jamshid',
            password: hashedPassword,
            role: 'CASHIER',
        },
    })

    // 2. Categories
    const catElec = await prisma.category.upsert({
        where: { id: 'cat-elec' },
        update: {},
        create: { id: 'cat-elec', name: 'Elektronika', description: 'Texnika va gadjetlar' }
    })
    const catFood = await prisma.category.upsert({
        where: { id: 'cat-food' },
        update: {},
        create: { id: 'cat-food', name: 'Oziq-Ovqat', description: 'Kundalik ehtiyoj mahsulotlari' }
    })
    const catCloth = await prisma.category.upsert({
        where: { id: 'cat-cloth' },
        update: {},
        create: { id: 'cat-cloth', name: 'Kiyim-Kechak', description: 'Kiyim va aksessuarlar' }
    })
    const catChem = await prisma.category.upsert({
        where: { id: 'cat-chem' },
        update: {},
        create: { id: 'cat-chem', name: 'Kimyo Mahsulotlari', description: 'Uy kimyosi' }
    })

    // 3. Suppliers
    const supTech = await prisma.supplier.upsert({
        where: { id: 'sup-tech' },
        update: {},
        create: {
            id: 'sup-tech',
            name: 'Texno Savdo MChJ',
            email: 'info@texnosavdo.uz',
            phone: '+998 90 123 45 67',
            address: 'Toshkent, Chilonzor'
        }
    })
    const supFood = await prisma.supplier.upsert({
        where: { id: 'sup-food' },
        update: {},
        create: {
            id: 'sup-food',
            name: 'Milliy Oziq-Ovqat',
            email: 'contact@milliyoziq.uz',
            phone: '+998 91 234 56 78',
            address: 'Samarqand, Bozor ko\'chasi 12'
        }
    })

    // 4. Products
    const products = [
        { id: 'p-phone', sku: 'EL-001', name: 'Samsung Galaxy A55', price: 4500000, cost: 3800000, unit: 'dona', categoryId: catElec.id, supplierId: supTech.id },
        { id: 'p-laptop', sku: 'EL-002', name: 'Lenovo IdeaPad 3', price: 7200000, cost: 6100000, unit: 'dona', categoryId: catElec.id, supplierId: supTech.id },
        { id: 'p-earphone', sku: 'EL-003', name: 'TWS Quloqchin', price: 280000, cost: 180000, unit: 'dona', categoryId: catElec.id, supplierId: supTech.id },
        { id: 'p-rice', sku: 'FD-001', name: 'Uzun Don Guruch', price: 18000, cost: 13000, unit: 'kg', categoryId: catFood.id, supplierId: supFood.id },
        { id: 'p-oil', sku: 'FD-002', name: 'Kungaboqar Yog\'i', price: 25000, cost: 19000, unit: 'litr', categoryId: catFood.id, supplierId: supFood.id },
        { id: 'p-flour', sku: 'FD-003', name: 'Bug\'doy Uni', price: 12000, cost: 9000, unit: 'kg', categoryId: catFood.id, supplierId: supFood.id },
        { id: 'p-sugar', sku: 'FD-004', name: 'Qand Shakar', price: 14000, cost: 11000, unit: 'kg', categoryId: catFood.id, supplierId: supFood.id },
        { id: 'p-tshirt', sku: 'CL-001', name: 'Erkaklar Futbolkasi', price: 85000, cost: 55000, unit: 'dona', categoryId: catCloth.id },
        { id: 'p-jeans', sku: 'CL-002', name: 'Ko\'k Jinsi Shimlar', price: 250000, cost: 175000, unit: 'juft', categoryId: catCloth.id },
        { id: 'p-detergent', sku: 'CH-001', name: 'Kir Yuvish Kukuni', price: 32000, cost: 22000, unit: 'kg', categoryId: catChem.id },
        { id: 'p-shampoo', sku: 'CH-002', name: 'Soch Shampuni', price: 28000, cost: 18000, unit: 'litr', categoryId: catChem.id },
    ]

    for (const p of products) {
        const prod = await prisma.product.upsert({
            where: { sku: p.sku },
            update: { name: p.name, price: p.price, cost: p.cost, unit: p.unit },
            create: {
                id: p.id,
                sku: p.sku,
                name: p.name,
                price: p.price,
                cost: p.cost,
                unit: p.unit,
                categoryId: p.categoryId,
                supplierId: p.supplierId,
            }
        })

        // Inventory - upsert to avoid duplicate errors
        await prisma.inventory.upsert({
            where: { productId_location: { productId: prod.id, location: 'Main Warehouse' } },
            update: {},
            create: { productId: prod.id, quantity: Math.floor(Math.random() * 80) + 20, location: 'Main Warehouse' }
        })

        // Low stock item for Jeans
        if (p.sku === 'CL-002') {
            await prisma.inventory.upsert({
                where: { productId_location: { productId: prod.id, location: 'Storefront A' } },
                update: {},
                create: { productId: prod.id, quantity: 3, location: 'Storefront A' }
            })
        }
    }

    // 5. Customers
    const customers = [
        { email: 'alisher@mail.uz', name: 'Alisher Karimov', phone: '+998 90 111 22 33', points: 520 },
        { email: 'malika@mail.uz', name: 'Malika Rahimova', phone: '+998 91 222 33 44', points: 250 },
        { email: 'bobur@mail.uz', name: 'Bobur Toshmatov', phone: '+998 93 333 44 55', points: 0 },
    ]
    try {
        await prisma.customer.createMany({ data: customers })
    } catch { /* already seeded */ }


    console.log('✅ Ma\'lumotlar bazasi muvaffaqiyatli to\'ldirildi!')
    console.log(`   👤 Foydalanuvchilar: admin@nexus.com (parol: password123)`)
    console.log(`   📦 Mahsulotlar: ${products.length} ta (turli o'lchov birliklar bilan)`)
    console.log(`   👥 Mijozlar: ${customers.length} ta`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
