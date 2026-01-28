import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { createAuditEntry } from './auditLogController';

const createReturnSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(5),
    items: z.array(z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().positive()
    })).nonempty()
});

/**
 * @desc    Process a return/refund
 * @route   POST /api/returns
 * @access  Private (Admin/Manager/Sales)
 */
export const createReturn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId, reason, items } = createReturnSchema.parse(req.body);
        const user = req.user as { id: string };

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order) throw new Error('Order not found');

            let totalRefund = 0;
            const returnItemsData = [];

            for (const item of items) {
                const orderItem = order.items.find(oi => oi.id === item.orderItemId);
                if (!orderItem) throw new Error(`Item ${item.orderItemId} not found in this order`);
                if (item.quantity > orderItem.quantity) throw new Error(`Cannot return more than purchased for ${orderItem.productId}`);

                // Calculate refund for this item
                const itemRefund = orderItem.price * item.quantity;
                totalRefund += itemRefund;

                returnItemsData.push({
                    orderItemId: item.orderItemId,
                    quantity: item.quantity
                });

                // Restock the product
                await tx.product.update({
                    where: { id: orderItem.productId },
                    data: { stockQuantity: { increment: item.quantity } }
                });

                // Log Stock Movement
                await tx.stockMovement.create({
                    data: {
                        productId: orderItem.productId,
                        type: 'RETURN',
                        quantity: item.quantity,
                        reason: `Return: ${reason} (Order: ${order.orderNumber})`,
                        userId: user.id
                    }
                });
            }

            // Create Return Record
            const returnRecord = await tx.return.create({
                data: {
                    orderId,
                    reason,
                    totalRefund,
                    status: 'COMPLETED',
                    items: {
                        create: returnItemsData
                    }
                },
                include: { items: true }
            });

            return returnRecord;
        });

        // Audit Log for the return
        await createAuditEntry({
            action: 'ORDER_RETURN',
            entityType: 'ORDER',
            entityId: orderId,
            userId: user.id,
            newValue: result,
            reason: reason
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all returns
 * @route   GET /api/returns
 * @access  Private (Admin/Manager)
 */
export const getReturns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [returns, total] = await Promise.all([
            prisma.return.findMany({
                skip,
                take: limit,
                include: {
                    order: { select: { orderNumber: true, createdAt: true } },
                    items: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.return.count()
        ]);

        res.json({
            returns,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        next(error);
    }
};
