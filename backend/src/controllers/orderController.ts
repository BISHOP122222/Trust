import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

// Validation Schemas
const orderItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    serialNumber: z.string().optional(), // Snapshot of serial string
    serialItemId: z.string().uuid().optional(), // Reference to specific SerialItem unit
    discountAmount: z.number().nonnegative().optional().default(0) // New: Per-item discount
});

const createOrderSchema = z.object({
    items: z.array(orderItemSchema).nonempty(),
    paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'CARD']).default('CASH'),
    customerId: z.string().uuid().optional(),
    amountTendered: z.number().positive().optional(),
    discountId: z.string().uuid().optional(),
    discountAmount: z.number().nonnegative().optional(),
    couponCode: z.string().optional()
});

// @desc    Create new order (Physical Shop Sale)
// @route   POST /api/orders
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { items, customerId, paymentMethod, amountTendered, discountId, discountAmount: manualDiscount, couponCode } = createOrderSchema.parse(req.body);
        const user = req.user as { id: string; role: string };

        const order = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const orderItems = [];

            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) throw new Error(`Product not found: ${item.productId}`);
                if (product.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
                }

                let warrantyExpiry = null;
                if (product.warrantyMonths > 0) {
                    const expiryDate = new Date();
                    expiryDate.setMonth(expiryDate.getMonth() + product.warrantyMonths);
                    warrantyExpiry = expiryDate;
                }

                // Handle Serialization
                let serialItemId = item.serialItemId;
                let serialNumber = item.serialNumber || null;

                if (product.isSerialized) {
                    if (!serialItemId) throw new Error(`Serial ID required for ${product.name}`);

                    const serialItem = await tx.serialItem.findUnique({
                        where: { id: serialItemId }
                    });

                    if (!serialItem || serialItem.productId !== item.productId || serialItem.status !== 'AVAILABLE') {
                        throw new Error(`Serial ${item.serialNumber || serialItemId} is not available for ${product.name}`);
                    }

                    serialNumber = serialItem.serialNumber;

                    // Mark Serial Item as SOLD and link to OrderItem (indirectly via ID update later)
                    await tx.serialItem.update({
                        where: { id: serialItemId },
                        data: { status: 'SOLD' }
                    });
                }

                const itemDiscount = item.discountAmount || 0;
                const itemSubtotal = (product.price * item.quantity) - itemDiscount;
                subtotal += itemSubtotal;

                orderItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                    costPrice: product.costPrice || 0,
                    discountAmount: itemDiscount,
                    serialNumber,
                    serialItemId,
                    warrantyExpiry
                });

                // Atomic stock deduction
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { decrement: item.quantity } }
                });

                // Record Stock Movement (Audit Trail)
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'OUT',
                        quantity: -item.quantity,
                        reason: `Sale: ORD-${Date.now().toString().slice(-6)}`, // Temporary ref
                        userId: user.id
                    }
                });
            }

            // Tax removal (tax set to 0 as requested)
            let taxAmount = 0;

            // Handle Discount
            let discountAmount = manualDiscount || 0;
            if (discountId && !manualDiscount) {
                const discount = await tx.discount.findUnique({ where: { id: discountId } });
                if (discount && discount.isActive) {
                    if (discount.type === 'PERCENTAGE') {
                        discountAmount = (subtotal * discount.value) / 100;
                        if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
                            discountAmount = discount.maxDiscount;
                        }
                    } else {
                        discountAmount = discount.value;
                    }
                }
            }

            const totalAmount = subtotal - discountAmount;

            const newOrder = await tx.order.create({
                data: {
                    orderNumber: `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
                    customerId: customerId || null,
                    agentId: user.id,
                    totalAmount,
                    subtotal,
                    taxAmount,
                    discountAmount,
                    discountId,
                    couponCode,
                    status: 'COMPLETED',
                    items: {
                        create: orderItems
                    },
                    payment: {
                        create: {
                            method: paymentMethod,
                            amount: totalAmount,
                            amountTendered: amountTendered || totalAmount,
                            changeAmount: amountTendered ? (amountTendered - totalAmount) : 0,
                            status: 'COMPLETED'
                        }
                    }
                },
                include: {
                    items: { include: { product: true } },
                    customer: true,
                    agent: true,
                    payment: true
                }
            });

            return newOrder;
        });

        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as { id: string; role: string };

        const whereClause: any = {};
        if (user.role === 'CUSTOMER') {
            whereClause.customerId = user.id;
        } else if (user.role === 'SALES_AGENT') {
            whereClause.agentId = user.id;
        }
        // Admins/Managers see all

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                customer: { select: { id: true, name: true, email: true } },
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                customer: { select: { name: true, email: true } },
                agent: { select: { name: true, email: true } },
                items: { include: { product: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Access check could be added here (if user owns order)

        res.json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: {
                status: 'CONFIRMED', // Or whatever "Paid" implies in this flow
                payment: {
                    create: {
                        amount: req.body.amount, // Simplified
                        method: req.body.method,
                        status: 'COMPLETED'
                    }
                }
            },
            include: { payment: true }
        });
        res.json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin/Manager
export const updateOrderToDelivered = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status: 'DELIVERED' }
        });
        res.json(order);
    } catch (error) {
        next(error);
    }
};
