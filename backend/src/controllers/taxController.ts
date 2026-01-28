import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const taxConfigSchema = z.object({
    name: z.string().min(1),
    rate: z.number().min(0).max(100),
    isActive: z.boolean().optional()
});

// @desc    Get all tax configurations
// @route   GET /api/tax
// @access  Private/Admin
export const getTaxConfigs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const configs = await prisma.taxConfig.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(configs);
    } catch (error) {
        next(error);
    }
};

// @desc    Get active tax configuration
// @route   GET /api/tax/active
// @access  Public
export const getActiveTaxConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await prisma.taxConfig.findFirst({
            where: { isActive: true }
        });
        res.json(config);
    } catch (error) {
        next(error);
    }
};

// @desc    Create new tax configuration
// @route   POST /api/tax
// @access  Private/Admin
export const createTaxConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = taxConfigSchema.parse(req.body);

        // If setting as active, deactivate all others
        if (data.isActive) {
            await prisma.taxConfig.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }

        const config = await prisma.taxConfig.create({ data });
        res.status(201).json(config);
    } catch (error) {
        next(error);
    }
};

// @desc    Update tax configuration
// @route   PUT /api/tax/:id
// @access  Private/Admin
export const updateTaxConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = taxConfigSchema.partial().parse(req.body);

        // If setting as active, deactivate all others
        if (data.isActive) {
            await prisma.taxConfig.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }

        const config = await prisma.taxConfig.update({
            where: { id: req.params.id },
            data
        });
        res.json(config);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete tax configuration
// @route   DELETE /api/tax/:id
// @access  Private/Admin
export const deleteTaxConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.taxConfig.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Tax configuration deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Calculate tax for given amount
// @route   POST /api/tax/calculate
// @access  Private
export const calculateTax = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { subtotal } = req.body;

        const activeTax = await prisma.taxConfig.findFirst({
            where: { isActive: true }
        });

        if (!activeTax) {
            return res.json({ taxAmount: 0, taxRate: 0, taxName: null });
        }

        const taxAmount = (subtotal * activeTax.rate) / 100;

        res.json({
            taxAmount: Math.round(taxAmount * 100) / 100,
            taxRate: activeTax.rate,
            taxName: activeTax.name
        });
    } catch (error) {
        next(error);
    }
};
