
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedAdmin } from './utils/seeder';

const prisma = new PrismaClient();

async function checkUser() {
    console.log('Running seeder explicitly to ensure admin exists...');
    await seedAdmin();

    console.log('Checking admin user...');
    const email = 'admin@trust.com';
    const password = 'password123';

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('User not found!');
            return;
        }

        console.log('User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            passwordHash: user.password.substring(0, 10) + '...'
        });

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
