import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const brandingSchema = z.object({
    businessName: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional().or(z.literal('')),
    logoUrl: z.string().optional().or(z.literal('')),
    theme: z.enum(['BLUE', 'GREEN', 'ORANGE', 'PURPLE']).optional(),
    enableCustomTheme: z.boolean().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    footerMessage: z.string().optional()
});

/**
 * @desc    Get branding settings
 * @route   GET /api/branding
 * @access  Public (needed for receipts)
 */
export const getBranding = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let branding = await prisma.brandingSettings.findFirst();

        if (!branding) {
            branding = await prisma.brandingSettings.create({
                data: {
                    businessName: "TRUST POS",
                    address: "Kampala, Uganda",
                    phone: "+256 XXX XXXXXX",
                    footerMessage: "Thank you for your business!",
                    theme: "BLUE"
                }
            });
        }

        res.json(branding);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update branding settings
 * @route   PUT /api/branding
 * @access  Private (Admin only)
 */
export const updateBranding = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = brandingSchema.parse(req.body);

        let branding = await prisma.brandingSettings.findFirst();

        if (branding) {
            branding = await prisma.brandingSettings.update({
                where: { id: branding.id },
                data: validatedData
            });
        } else {
            branding = await prisma.brandingSettings.create({
                data: validatedData as any
            });
        }

        res.json(branding);
    } catch (error) {
        console.error('Update branding failed:', error);
        next(error);
    }
};

/**
 * @desc    Upload business logo
 * @route   POST /api/branding/upload-logo
 * @access  Private (Admin only)
 */
export const uploadLogo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Construct URL path (assuming /uploads is served statically)
        const logoUrl = `/uploads/${req.file.filename}`;

        let branding = await prisma.brandingSettings.findFirst();

        if (branding) {
            branding = await prisma.brandingSettings.update({
                where: { id: branding.id },
                data: { logoUrl }
            });
        } else {
            branding = await prisma.brandingSettings.create({
                data: {
                    businessName: "TRUST POS",
                    logoUrl
                }
            });
        }

        res.json(branding);
    } catch (error) {
        console.error('Logo upload failed:', error);
        next(error);
    }
};
