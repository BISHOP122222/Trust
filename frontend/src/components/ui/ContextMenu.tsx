import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, RefreshCw, User, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useSales } from '@/contexts/SalesContext';
import { useToast } from '@/contexts/ToastContext';


export default function ContextMenu() {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const navigate = useNavigate();
    const { logout } = useUser();
    const { refreshStats } = useSales();
    const { showToast } = useToast();

    const handleContextMenu = useCallback((e: MouseEvent) => {
        e.preventDefault();
        setPosition({ x: e.pageX, y: e.pageY });
        setVisible(true);
    }, []);

    const handleClick = useCallback(() => {
        setVisible(false);
    }, []);

    useEffect(() => {
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('click', handleClick);
        };
    }, [handleContextMenu, handleClick]);

    const menuItems = [
        { label: 'Refresh Data', icon: RefreshCw, action: async () => { await refreshStats(); showToast('Data refreshed'); } },
        { label: 'Profile Settings', icon: User, action: () => navigate('/settings?tab=profile') },
        { label: 'System Settings', icon: Settings, action: () => navigate('/settings') },
        { label: 'View Documentation', icon: HelpCircle, action: () => navigate('/settings?tab=help') },
        { label: 'Logout', icon: LogOut, action: logout, danger: true },
    ];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ top: position.y, left: position.x }}
                    className="fixed z-[100] min-w-[180px] bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-2"
                >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</p>
                    </div>
                    {menuItems.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.action();
                                setVisible(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${item.danger
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
