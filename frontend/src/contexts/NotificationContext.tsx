import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    timestamp: string;
    link?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    clearNotification: (id: string) => void;
    clearAll: () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const saved = localStorage.getItem('trust_notifications');
        return saved ? JSON.parse(saved) : [
            {
                id: '1',
                title: 'Welcome to TRUST',
                message: 'Start managing your inventory and sales efficiently.',
                type: 'info',
                read: false,
                timestamp: new Date().toISOString()
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('trust_notifications', JSON.stringify(notifications));
    }, [notifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const addNotification = (n: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
        // Simple deduplication: Check if a notification with same title/message was added in last 30s
        const isDuplicate = notifications.some(existing =>
            existing.title === n.title &&
            existing.message === n.message &&
            (Date.now() - new Date(existing.timestamp).getTime()) < 30000
        );

        if (isDuplicate) return;

        const newNotification: Notification = {
            ...n,
            id: Date.now().toString(),
            read: false,
            timestamp: new Date().toISOString()
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            clearNotification,
            clearAll,
            addNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};
