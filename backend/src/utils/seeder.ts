
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@trust.com';
        const ownerEmail = 'milanjohnso09@gmail.com';

        // Check if specific admin/owner already exists
        const adminExists = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!adminExists) {
            console.log('Seeding default admin...');
            const hashedPassword = await bcrypt.hash('password123', 10);

            await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'ADMIN', // Changed from SUPER_ADMIN to ADMIN
                    isActive: true
                }
            });
            console.log('Default admin seeded: admin@trust.com / password123');
        } else {
            console.log('Default admin check: admin@trust.com already exists.');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

export const seedCategories = async () => {
    try {
        const count = await prisma.category.count();
        if (count === 0) {
            console.log('Seeding default categories...');
            await prisma.category.createMany({
                data: [
                    { name: 'Electronics', description: 'Gadgets and devices' },
                    { name: 'Office Supplies', description: 'Stationery and office equipment' },
                    { name: 'Furniture', description: 'Desks, chairs, and tables' }
                ]
            });
            console.log('Categories seeded.');
        }
    } catch (error) {
        console.error('Error seeding categories:', error);
    }
};
