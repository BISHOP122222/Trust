import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

// @desc    Get all users (optionally filter by role)
// @route   GET /api/users
// @access  Private/Admin/Manager/Agent
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role } = req.query;
        const whereClause: any = {};
        if (role) whereClause.role = role.toString();

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                phone: true,
                bio: true,
                avatarUrl: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                phone: true,
                bio: true,
                avatarUrl: true,
                createdAt: true,
                soldOrders: {
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, role, phone, bio, avatarUrl } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'SALES_AGENT',
                phone,
                bio,
                avatarUrl,
                isActive: true
            }
        });

        res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, role, isActive, phone, bio, avatarUrl } = req.body;
        const dataToUpdate: any = { name, email, role, isActive, phone, bio, avatarUrl };
        if (req.body.password) {
            dataToUpdate.password = await bcrypt.hash(req.body.password, 10);
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, role: true, isActive: true, phone: true, bio: true, avatarUrl: true }
        });
        res.json(user);
    } catch (error) {
        if ((error as any).code === 'P2025') return res.status(404).json({ message: 'User not found' });
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: 'User removed' });
    } catch (error) {
        if ((error as any).code === 'P2025') return res.status(404).json({ message: 'User not found' });
        next(error);
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.user?.id;
        if (!id) return res.status(401).json({ message: 'Not authorized' });

        const { name, email, phone, bio, avatarUrl, currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const dataToUpdate: any = { name, email, phone, bio, avatarUrl };

        if (newPassword) {
            if (!currentPassword) return res.status(400).json({ message: 'Current password is required to set a new one' });
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });
            dataToUpdate.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, role: true, phone: true, bio: true, avatarUrl: true }
        });

        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};
