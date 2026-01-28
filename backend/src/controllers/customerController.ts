import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                orders: {
                    select: {
                        id: true,
                        totalAmount: true
                    }
                },
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform data to match frontend expectations
        const formattedCustomers = customers.map(customer => {
            const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);

            return {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone || 'N/A',
                spent: totalSpent, // Send as number, frontend can format
                orders: customer._count.orders,
                status: 'Active' // Customers are always active in this simple model, or add isActive to schema later
            };
        });

        res.json(formattedCustomers);
    } catch (error) {
        next(error);
    }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, phone } = req.body;

        // Basic validation
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        if (email) {
            const existingCustomer = await prisma.customer.findFirst({ where: { email } });
            if (existingCustomer) {
                return res.status(400).json({ message: 'Customer with this email already exists' });
            }
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                // address can be added if needed
            }
        });

        res.status(201).json(customer);
    } catch (error) {
        next(error);
    }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await prisma.customer.delete({ where: { id } });
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
};
