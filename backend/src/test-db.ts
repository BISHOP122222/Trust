
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to connect to database...');
        const result = await prisma.$queryRaw`SELECT 1`;
        console.log('Database connection successful:', result);

        const count = await prisma.user.count();
        console.log('User count:', count);

        const branding = await prisma.brandingSettings.findFirst();
        console.log('Branding settings:', branding);

    } catch (error) {
        console.error('Database connection failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
