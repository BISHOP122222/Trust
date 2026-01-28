import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const createDiscountSchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().optional(),
    code: z.string().min(3).max(20).transform(val => val.toUpperCase()),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'BOGO']),
    value: z.number().nonnegative(),
    minPurchase: z.number().nonnegative().default(0),
    maxDiscount: z.number().nonnegative().nullable().optional(),
    startDate: z.string().datetime().nullable().optional().transform(val => val ? new Date(val) : null),
    endDate: z.string().datetime().nullable().optional().transform(val => val ? new Date(val) : null),
    isActive: z.boolean().default(true)
});

// @desc    Get all discounts
// @route   GET /api/discounts
// @access  Private
export const getAllDiscounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const discounts = await prisma.discount.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(discounts);
    } catch (error) {
        next(error);
    }
};

// @desc    Get active discounts
// @route   GET /api/discounts/active
// @access  Public
export const getActiveDiscounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const now = new Date();
        const discounts = await prisma.discount.findMany({
            where: {
                isActive: true,
                AND: [
                    {
                        OR: [
                            { startDate: null },
                            { startDate: { lte: now } }
                        ]
                    },
                    {
                        OR: [
                            { endDate: null },
                            { endDate: { gte: now } }
                        ]
                    }
                ]
            }
        });
        res.json(discounts);
    } catch (error) {
        next(error);
    }
};

// @desc    Create new discount
// @route   POST /api/discounts
// @access  Private (Admin/SalesManager)
export const createDiscount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = createDiscountSchema.parse(req.body);

        // Check if code already exists
        const existingDiscount = await prisma.discount.findUnique({
            where: { code: validatedData.code }
        });

        if (existingDiscount) {
            return res.status(400).json({ message: 'Discount code already exists' });
        }

        const discount = await prisma.discount.create({
            data: validatedData as any
        });

        res.status(201).json(discount);
    } catch (error) {
        next(error);
    }
};

// @desc    Validate discount code
// @route   POST /api/discounts/validate
// @access  Private
export const validateDiscount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code, cartTotal } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Discount code is required' });
        }

        const discount = await prisma.discount.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!discount || !discount.isActive) {
            return res.status(404).json({ message: 'Invalid or inactive discount code' });
        }

        const now = new Date();
        if (discount.startDate && discount.startDate > now) {
            return res.status(400).json({ message: 'Discount code is not active yet' });
        }
        if (discount.endDate && discount.endDate < now) {
            return res.status(400).json({ message: 'Discount code has expired' });
        }

        if (discount.minPurchase !== null && cartTotal < discount.minPurchase) {
            return res.status(400).json({
                message: `Minimum order amount for this discount is UGX ${discount.minPurchase.toLocaleString()}`
            });
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === 'PERCENTAGE') {
            discountAmount = (cartTotal * discount.value) / 100;
            if (discount.maxDiscount !== null && discountAmount > discount.maxDiscount) {
                discountAmount = discount.maxDiscount;
            }
        } else {
            discountAmount = discount.value;
        }

        // Ensure discount doesn't exceed total
        discountAmount = Math.min(discountAmount, cartTotal);

        res.json({
            valid: true,
            discountId: discount.id,
            code: discount.code,
            type: discount.type,
            value: discount.value,
            discountAmount
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update discount
// @route   PUT /api/discounts/:id
// @access  Private (Admin/SalesManager)
export const updateDiscount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const discount = await prisma.discount.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(discount);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete discount
// @route   DELETE /api/discounts/:id
// @access  Private (Admin/SalesManager)
export const deleteDiscount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.discount.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Discount deleted successfully' });
    } catch (error) {
        next(error);
    }
};
