import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api'; // Import api instance

export type UserRole = 'SuperAdmin' | 'Owner' | 'Manager' | 'Cashier';

export interface UserProfile {
    id?: string;
    name: string;
    email: string;
    role: UserRole;
    photo: string;
    phone?: string;
    preferences?: {
        notifications?: {
            lowStock: boolean;
            dailyReports: boolean;
            newLogins: boolean;
            marketing: boolean;
        };
        security?: {
            twoFactor: boolean;
        };
    };
}

interface UserContextType {
    user: UserProfile | null;
    users: UserProfile[];
    login: (email: string, password: string, remember?: boolean) => Promise<UserProfile | null>;
    logout: () => void;
    updateUser: (updates: Partial<UserProfile>) => void;
    addUser: (user: UserProfile) => void;
    removeUser: (id: string) => void;
    updateUserInDb: (email: string, updates: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    // Users State (from Backend)
    const [usersList, setUsersList] = useState<UserProfile[]>([]);

    // Initialize User Session
    const [user, setUser] = useState<UserProfile | null>(() => {
        const savedUser = localStorage.getItem('trust_user_profile');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Persist User Session
    useEffect(() => {
        if (user) {
            localStorage.setItem('trust_user_profile', JSON.stringify(user));
        } else {
            localStorage.removeItem('trust_user_profile');
        }
    }, [user]);

    // Fetch Users from Backend
    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            const mappedUsers = response.data.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role === 'SUPER_ADMIN' ? 'SuperAdmin' : u.role === 'ADMIN' ? 'Owner' : u.role === 'SALES_MANAGER' ? 'Manager' : 'Cashier',
                photo: u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
                phone: u.phone || '',
                preferences: { notifications: { lowStock: true, dailyReports: true, newLogins: false, marketing: false } }
            }));
            setUsersList(mappedUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    // Initial Fetch
    useEffect(() => {
        if (user) {
            fetchUsers();
        }
    }, [user]);

    const login = async (email: string, password: string, remember: boolean = false): Promise<UserProfile | null> => {
        try {
            const response = await api.post('/auth/login', { email, password, remember });
            const { token, user: userData } = response.data;

            // Save token to localStorage
            localStorage.setItem('token', token);

            // System settings normalization
            const mapRoleToSystem = (r: string) => {
                if (r === 'SUPER_ADMIN') return 'SuperAdmin';
                if (r === 'ADMIN') return 'Owner';
                if (r === 'SALES_MANAGER') return 'Manager';
                return 'Cashier';
            };

            // Map backend user to frontend UserProfile structure
            const userProfile: UserProfile = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: mapRoleToSystem(userData.role) as any,
                photo: userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
                phone: userData.phone || '',
                preferences: { notifications: { lowStock: true, dailyReports: true, newLogins: true, marketing: false } }
            };

            // Save mapped profile to localStorage
            localStorage.setItem('trust_user_profile', JSON.stringify(userProfile));

            // Update State
            setUser(userProfile);
            return userProfile;
        } catch (error) {
            console.error('Login failed:', error);
            return null;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('trust_user_profile');
        window.location.href = '/login';
    };

    const updateUser = async (updates: Partial<UserProfile>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            // Also update in DB
            setUsersList(prev => prev.map(u => u.email === (user?.email || '') ? updatedUser : u));

            try {
                // Sync with backend
                const backendUpdates: any = {};
                if (updates.name) backendUpdates.name = updates.name;
                if (updates.email) backendUpdates.email = updates.email;
                if (updates.phone) backendUpdates.phone = updates.phone;
                if (updates.photo) backendUpdates.avatarUrl = updates.photo;

                await api.put('/users/profile', backendUpdates);
            } catch (error) {
                console.error('Failed to sync profile update to backend:', error);
            }
        }
    };

    const addUser = async (newUser: UserProfile) => {
        try {
            // Map frontend role to backend role
            const backendRole = newUser.role === 'SuperAdmin' ? 'SUPER_ADMIN' : newUser.role === 'Owner' ? 'ADMIN' : newUser.role === 'Manager' ? 'SALES_MANAGER' : 'SALES_AGENT';

            await api.post('/auth/register', {
                name: newUser.name,
                email: newUser.email,
                password: 'password123', // Default password for new staff
                role: backendRole
            });

            fetchUsers(); // Refresh list
        } catch (error) {
            console.error('Failed to add user', error);
        }
    };

    const removeUser = async (id: string) => {
        try {
            // Optimistic update
            setUsersList(prev => prev.filter(u => u.id !== id));
            // Call API
            await api.delete(`/users/${id}`);
        } catch (error) {
            console.error('Failed to remove user', error);
            fetchUsers(); // Revert on error
        }
    };

    const updateUserInDb = async (email: string, updates: Partial<UserProfile>) => {
        // Optimistic update
        setUsersList(prev => prev.map(u => u.email === email ? { ...u, ...updates } : u));

        // If updating the currently logged in user, update session too
        if (user && user.email.toLowerCase() === email.toLowerCase()) {
            setUser(prev => prev ? { ...prev, ...updates } : null);
        }

        try {
            // Find user ID from the list
            const userToUpdate = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (userToUpdate && userToUpdate.id) {
                const backendUpdates: any = {};
                if (updates.name) backendUpdates.name = updates.name;
                if (updates.role) {
                    backendUpdates.role = updates.role === 'SuperAdmin' ? 'SUPER_ADMIN' : updates.role === 'Owner' ? 'ADMIN' : updates.role === 'Manager' ? 'SALES_MANAGER' : 'SALES_AGENT';
                }
                if (updates.phone) backendUpdates.phone = updates.phone;
                if (updates.photo) backendUpdates.avatarUrl = updates.photo;

                await api.put(`/users/${userToUpdate.id}`, backendUpdates);
            }
        } catch (error) {
            console.error('Failed to update user in DB:', error);
        }
    };

    // Use the fetched list
    const users = usersList;

    return (
        <UserContext.Provider value={{ user, users, login, logout, updateUser, addUser, removeUser, updateUserInDb }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};
