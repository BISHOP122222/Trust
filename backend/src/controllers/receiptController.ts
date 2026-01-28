import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

// @desc    Generate receipt for an order
// @route   POST /api/receipts/generate/:orderId
// @access  Private
export const generateReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;

        // Get order with all details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: { product: true }
                },
                customer: true,
                agent: true,
                payment: true
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if receipt already exists
        const existingReceipt = await prisma.receipt.findUnique({
            where: { orderId }
        });

        if (existingReceipt) {
            return res.status(400).json({ message: 'Receipt already exists for this order' });
        }

        // Fetch branding settings
        let branding = await prisma.brandingSettings.findFirst();
        if (!branding) {
            // Create default branding if none exists
            branding = await prisma.brandingSettings.create({
                data: {
                    businessName: "TRUST POS",
                    footerMessage: "Thank you for your business!"
                }
            });
        }

        // Generate receipt number
        const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;

        // Create receipt content (JSON format)
        const receiptContent = {
            branding: {
                businessName: branding.businessName,
                address: branding.address,
                phone: branding.phone,
                email: branding.email,
                logoUrl: branding.logoUrl,
                footerMessage: branding.footerMessage
            },
            orderNumber: order.orderNumber,
            receiptNumber,
            date: new Date().toISOString(),
            customer: order.customer ? {
                name: order.customer.name,
                email: order.customer.email
            } : { name: 'Walk-in Customer' },
            agent: order.agent ? {
                name: order.agent.name
            } : { name: 'Unknown Agent' },
            items: order.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                unitPrice: item.price,
                total: item.price * item.quantity,
                serialNumber: item.serialNumber,
                warrantyExpiry: item.warrantyExpiry
            })),
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            discountAmount: order.discountAmount,
            totalAmount: order.totalAmount,
            paymentMethod: order.payment?.method || 'N/A',
            paymentStatus: order.payment?.status || 'PENDING',
            amountTendered: order.payment?.amountTendered || order.totalAmount,
            changeAmount: order.payment?.changeAmount || 0
        };

        // Create receipt
        const receipt = await prisma.receipt.create({
            data: {
                orderId,
                receiptNumber,
                content: JSON.stringify(receiptContent),
                printedAt: new Date()
            }
        });

        res.status(201).json({
            ...receipt,
            content: receiptContent // Return parsed content
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get receipt by ID
// @route   GET /api/receipts/:id
// @access  Private
export const getReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const receipt = await prisma.receipt.findUnique({
            where: { id: req.params.id },
            include: { order: true }
        });

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        //  Parse content
        res.json({
            ...receipt,
            content: JSON.parse(receipt.content)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get receipt by order ID
// @route   GET /api/receipts/order/:orderId
// @access  Private
export const getReceiptByOrderId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const receipt = await prisma.receipt.findUnique({
            where: { orderId: req.params.orderId }
        });

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found for this order' });
        }

        res.json({
            ...receipt,
            content: JSON.parse(receipt.content)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reprint receipt
// @route   POST /api/receipts/:id/reprint
// @access  Private
export const reprintReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const receipt = await prisma.receipt.update({
            where: { id: req.params.id },
            data: {
                reprintCount: { increment: 1 }
            }
        });

        res.json({
            ...receipt,
            content: JSON.parse(receipt.content)
        });
    } catch (error) {
        next(error);
    }
};
