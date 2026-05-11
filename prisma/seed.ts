import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)
    console.log('🌱 Tizimni tozalash va Super Admin yaratish...')

    // 1. Super Admin yaratish
    await prisma.user.upsert({
        where: { email: 'admin@nuts.com' },
        update: {},
        create: {
            email: 'admin@nuts.com',
            name: 'Super Admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
        },
    })

    console.log('✅ Baza tozalandi va Super Admin tayyor!')
    console.log('   👤 Login: admin@nuts.com')
    console.log('   🔑 Parol: password123')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
