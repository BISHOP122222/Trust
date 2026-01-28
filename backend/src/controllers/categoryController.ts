
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation Schemas
const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    parentId: z.string().optional().nullable(),
});

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true, subCategories: true }
                }
            }
        });
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

// @desc    Fetch single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id: req.params.id },
            include: {
                products: true,
                subCategories: true,
                parent: true
            }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin/Manager
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = categorySchema.parse(req.body);

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { name: validatedData.name }
        });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await prisma.category.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                parentId: validatedData.parentId
            }
        });

        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin/Manager
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const validatedData = categorySchema.partial().parse(req.body);

        const category = await prisma.category.update({
            where: { id },
            data: {
                name: validatedData.name,
                description: validatedData.description,
                parentId: validatedData.parentId
            }
        });

        res.json(category);
    } catch (error) {
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Category not found' });
        }
        next(error);
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin/Manager
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.category.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Category removed' });
    } catch (error) {
        if ((error as any).code === 'P2003') {
            return res.status(400).json({ message: 'Cannot delete category with associated products' });
        }
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Category not found' });
        }
        next(error);
    }
};

// @desc    Get category sales stats
// @route   GET /api/categories/stats
// @access  Public
export const getCategoryStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        // Calculate sales for each category
        const stats = await Promise.all(categories.map(async (category) => {
            // Aggregate total sales for products in this category
            // We need to look at OrderItems for COMPLETED orders
            const sales = await prisma.orderItem.aggregate({
                _sum: {
                    price: true, // Note: precise revenue is price * quantity. aggregate with _sum only sums columns. 
                    // Prisma doesn't support computed sums directly in aggregate easily without raw query or grouping.
                    // For accuracy with quantity, we should group by or use findMany.
                },
                where: {
                    product: { categoryId: category.id },
                    order: { status: 'COMPLETED' }
                }
            });

            // To get accurate (price * quantity) sum:
            const orderItems = await prisma.orderItem.findMany({
                where: {
                    product: { categoryId: category.id },
                    order: { status: 'COMPLETED' }
                },
                select: {
                    price: true,
                    quantity: true
                }
            });

            const totalSales = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Format to Millions/Thousands if needed, but sending raw number is better for frontend
            // Let's send a formatted string for immediate UI compatibility 
            // but also raw value for flexibility
            const formattedSales = totalSales >= 1000000
                ? `UGX ${(totalSales / 1000000).toFixed(1)}M`
                : totalSales >= 1000
                    ? `UGX ${(totalSales / 1000).toFixed(1)}K`
                    : `UGX ${totalSales.toLocaleString()}`;

            return {
                id: category.id,
                name: category.name,
                count: category._count.products,
                sales: formattedSales,
                rawValue: totalSales,
                color: '' // Frontend assigns colors usually, or could be stored
            };
        }));

        res.json(stats);
    } catch (error) {
        next(error);
    }
};
