const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    
    for (const user of users) {
        // Check if password is already hashed (bcrypt hashes start with $2)
        if (!user.password.startsWith('$2')) {
            console.log(`Hashing password for user: ${user.email}`);
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            console.log(`Updated ${user.email}`);
        } else {
            console.log(`User ${user.email} already has a hashed password.`);
        }
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
