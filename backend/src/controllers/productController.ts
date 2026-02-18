import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { createAuditEntry } from './auditLogController';

// Validation Schemas
const productSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    price: z.union([z.number(), z.string().transform(v => parseFloat(v))]).pipe(z.number().positive()),
    costPrice: z.union([z.number(), z.string().transform(v => parseFloat(v))]).pipe(z.number().positive()).optional().nullable(),
    sku: z.string().optional().nullable().transform(val => val === "" ? null : val),
    brand: z.string().optional(),
    imageUrl: z.string().optional(),
    isSerialized: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
    serialNumbers: z.array(z.string()).optional(), // For bulk serial ingestion
    serialNumber: z.string().optional().nullable().transform(val => val === "" ? null : val),
    stockQuantity: z.union([z.number().int(), z.string().transform(v => parseInt(v))]).pipe(z.number().int().min(0)).optional(),
    lowStockThreshold: z.union([z.number().int(), z.string().transform(v => parseInt(v))]).pipe(z.number().int().min(0)).optional(),
    categoryId: z.string().uuid(),
    warrantyMonths: z.union([z.number().int(), z.string().transform(v => parseInt(v))]).pipe(z.number().int().min(0)).optional()
});


// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50; // Increased default limit
        const skip = (page - 1) * limit;

        const { keyword, categoryId, lowStock } = req.query;

        const where: any = { isActive: true };

        if (keyword) {
            where.OR = [
                { name: { contains: keyword as string } },
                { sku: { contains: keyword as string } },
                { description: { contains: keyword as string } }
            ];
        }

        const { brand, minPrice, maxPrice } = req.query;
        if (brand) where.brand = brand as string;
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice as string);
            if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
        }

        if (categoryId) {
            where.categoryId = categoryId as string;
        }

        const { specKey, specValue } = req.query;
        if (specKey && specValue) {
            where.specs = {
                some: {
                    key: specKey as string,
                    value: specValue as string
                }
            };
        }

        if (lowStock === 'true') {
            // Optimize low stock filtering using raw SQL for field-to-field comparison
            const lowStockIds = await prisma.$queryRaw<{ id: string }[]>`
                SELECT id FROM Product 
                WHERE stockQuantity <= lowStockThreshold AND isActive = 1
            `;
            const ids = lowStockIds.map(p => p.id);
            where.id = { in: ids };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: true,
                    specs: true,
                    serialItems: {
                        where: { status: 'AVAILABLE' }
                    }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            products,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                specs: true,
                serialItems: true
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin/Manager
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = productSchema.parse(req.body);

        // Enforce Pricing Rule: Selling Price >= Cost Price
        if (validatedData.costPrice && validatedData.price < validatedData.costPrice) {
            return res.status(400).json({
                message: `Selling price (UGX ${validatedData.price}) cannot be lower than cost price (UGX ${validatedData.costPrice})`
            });
        }

        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : validatedData.imageUrl;
        const sku = validatedData.sku || null;

        // Extract serial numbers if provided
        const { serialNumbers, ...productData } = validatedData;
        const isSerialized = validatedData.isSerialized || false;

        const product = await prisma.product.create({
            data: {
                ...productData,
                sku: sku as any,
                imageUrl,
                isSerialized,
                stockQuantity: isSerialized ? (serialNumbers?.length || 0) : (validatedData.stockQuantity || 0),
                serialItems: isSerialized && serialNumbers ? {
                    create: serialNumbers.map(sn => ({
                        serialNumber: sn,
                        status: 'AVAILABLE'
                    }))
                } : undefined
            },
            include: { serialItems: true }
        });

        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};



// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin/Manager
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;
        const validatedData = productSchema.partial().parse(req.body);

        const existingProduct = await prisma.product.findUnique({ where: { id } });
        if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

        const finalPrice = validatedData.price ?? existingProduct.price;
        const finalCost = validatedData.costPrice ?? existingProduct.costPrice;

        if (finalCost && finalPrice < finalCost) {
            return res.status(400).json({
                message: `Update failed: New selling price (UGX ${finalPrice}) would be lower than cost price (UGX ${finalCost})`
            });
        }

        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : validatedData.imageUrl;

        const { serialNumbers, ...productData } = validatedData;
        const isSerialized = productData.isSerialized ?? existingProduct.isSerialized;

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...productData,
                imageUrl,
                stockQuantity: isSerialized && serialNumbers
                    ? { increment: serialNumbers.length }
                    : productData.stockQuantity,
                serialItems: isSerialized && serialNumbers ? {
                    create: serialNumbers.map(sn => ({
                        serialNumber: sn,
                        status: 'AVAILABLE'
                    }))
                } : undefined
            },
            include: { serialItems: true }
        });

        // Audit Logging for sensitive changes
        const priceChanged = validatedData.price !== undefined && validatedData.price !== existingProduct.price;
        const stockChanged = validatedData.stockQuantity !== undefined && validatedData.stockQuantity !== existingProduct.stockQuantity;

        if (priceChanged || stockChanged) {
            await createAuditEntry({
                action: priceChanged && stockChanged ? 'PRICE_AND_STOCK_UPDATE' : priceChanged ? 'PRICE_CHANGE' : 'STOCK_ADJUSTMENT',
                entityType: 'PRODUCT',
                entityId: id,
                userId: userId,
                oldValue: { price: existingProduct.price, stock: existingProduct.stockQuantity },
                newValue: { price: product.price, stock: product.stockQuantity },
                reason: req.body.reason || 'Manual inventory update'
            });
        }

        res.json(product);
    } catch (error) {
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Product not found' });
        }
        next(error);
    }
};


// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin/Manager
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await prisma.product.delete({
            where: { id }
        });

        await createAuditEntry({
            action: 'PRODUCT_DELETE',
            entityType: 'PRODUCT',
            entityId: id,
            userId: userId,
            oldValue: product,
            reason: 'Permanent item removal'
        });

        res.json({ message: 'Product removed' });
    } catch (error) {
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ message: 'Product not found' });
        }
        next(error);
    }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { quantity, type } = req.body;
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        let newQuantity = quantity;
        if (type === 'add') newQuantity = product.stockQuantity + quantity;
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { stockQuantity: Math.max(0, newQuantity) }
        });
        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
};


