
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding realistic orders...');

    // 1. Get all products and categories
    const products = await prisma.product.findMany({ include: { category: true } });
    if (products.length === 0) {
        console.log('No products found. Please seed products first.');
        return;
    }

    // 2. Get or create a few customers
    let customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' } });
    if (customers.length < 5) {
        console.log('Creating mock customers...');
        for (let i = 0; i < 5; i++) {
            const customer = await prisma.user.create({
                data: {
                    email: faker.internet.email(),
                    password: 'password123', // In real app this should be hashed, but for seed it's fine
                    name: faker.person.fullName(),
                    role: 'CUSTOMER',
                    phone: faker.phone.number(),
                }
            });
            customers.push(customer);
        }
    }

    // 3. Create orders for the last 30 days
    const today = new Date();
    const ordersCount = 50; // Generate 50 orders

    for (let i = 0; i < ordersCount; i++) {
        // Random date within last 30 days
        const daysAgo = faker.number.int({ min: 0, max: 30 });
        const orderDate = new Date(today);
        orderDate.setDate(orderDate.getDate() - daysAgo);

        // Random customer
        const customer = customers[Math.floor(Math.random() * customers.length)];

        // Random items (1 to 5 items per order)
        const itemsCount = faker.number.int({ min: 1, max: 5 });
        const orderItems = [];
        let totalAmount = 0;
        let subtotal = 0;

        for (let j = 0; j < itemsCount; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const quantity = faker.number.int({ min: 1, max: 3 });
            const price = product.price; // Use current price for simplicity

            orderItems.push({
                productId: product.id,
                quantity: quantity,
                price: price,
            });

            subtotal += price * quantity;
        }

        totalAmount = subtotal; // Assuming no tax/discount for simplicity in this seed

        // Create Order
        await prisma.order.create({
            data: {
                orderNumber: `ORD-${Date.now()}-${i}`,
                status: 'COMPLETED',
                totalAmount: totalAmount,
                subtotal: subtotal,
                customerId: customer.id,
                createdAt: orderDate,
                items: {
                    create: orderItems
                },
                payment: {
                    create: {
                        amount: totalAmount,
                        method: faker.helpers.arrayElement(['CASH', 'MOBILE_MONEY', 'CARD']),
                        status: 'COMPLETED'
                    }
                }
            }
        });

        process.stdout.write('.');
    }

    console.log(`\nSuccessfully created ${ordersCount} orders.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
