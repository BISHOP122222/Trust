import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { sendWelcomeEmail, sendResetEmail } from '../utils/email';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Schemas
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_AGENT', 'INVENTORY_MANAGER', 'CUSTOMER']).optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    remember: z.boolean().optional()
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, role } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'CUSTOMER'
            }
        });

        // Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );

        // Send Welcome Email
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            console.error('Welcome Email Error:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                phone: user.phone
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, remember } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is disabled' });
        }

        const expiresIn = remember ? '30d' : '1d';

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: expiresIn }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                phone: user.phone
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { id: string; role: string } | undefined;
    const userId = user?.id;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, isActive: true, avatarUrl: true, phone: true, createdAt: true }
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
}

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                avatarUrl: true,
                phone: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform for frontend if needed or keep raw
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = z.object({ email: z.string().email() }).parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'No user found with that email address' });
        }

        // Generate Reset Token (32 bytes)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedToken,
                resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            }
        });

        try {
            await sendResetEmail(user.email, resetToken);
            res.json({ message: 'Password reset link sent to email' });
        } catch (emailError: any) {
            console.error('EMAIL_SEND_ERROR:', emailError);
            // Clean up if email fails
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: null,
                    resetTokenExpires: null
                }
            });
            return res.status(500).json({ message: 'Error sending email. Try again later.' });
        }
    } catch (error: any) {
        console.error('FORGOT_PASSWORD_ERROR:', error);
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, password } = z.object({
            token: z.string(),
            password: z.string().min(6)
        }).parse(req.body);

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
};
