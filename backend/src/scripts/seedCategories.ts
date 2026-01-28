
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    { name: 'Phones', description: 'Mobile phones and smartphones' },
    { name: 'Computers', description: 'Laptops, desktops, and servers' },
    { name: 'Audio', description: 'Headphones, speakers, and audio gear' },
    { name: 'Accessories', description: 'Cases, chargers, and other peripherals' },
    { name: 'Wires & Cables', description: 'USB cables, HDMI, power cords, etc.' },
    { name: 'Software', description: 'Operating systems, applications, and licenses' },
    { name: 'Electronics', description: 'General electronic devices' },
    { name: 'Office Supplies', description: 'Stationery, paper, and office equipment' },
    { name: 'Furniture', description: 'Desks, chairs, and office furniture' }
];

async function main() {
    console.log('Seeding categories...');
    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
        console.log(`- ${category.name}`);
    }
    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
