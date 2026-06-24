const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Mahalliy konflikt qilib turgan akkaunt o'chirilmoqda...");
    try {
        await prisma.user.delete({
            where: { email: 'yusuf@nuts.com' }
        });
        console.log("✅ Tozalandi! Endi admin@nuts.com orqali kirib sinxronlasangiz bo'ladi.");
    } catch (e) {
        console.log("Akkaunt allaqachon yo'q yoki boshqa xatolik: ", e.message);
    }
}

main().finally(() => prisma.$disconnect());
