import {
    LayoutDashboard, ShoppingCart, Package, Users, Briefcase,
    BarChart3, Settings, LogOut, Store, Tags, Undo2,
    Percent, History, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['Owner', 'Manager'] },
    { icon: ShoppingCart, label: 'Sales (POS)', path: '/sales', roles: ['Owner', 'Manager', 'Cashier'] },
    { icon: Package, label: 'Orders', path: '/orders', roles: ['Owner', 'Manager'] },
    { icon: Store, label: 'Inventory', path: '/inventory', roles: ['Owner', 'Manager'] },
    { icon: Tags, label: 'Categories', path: '/categories', roles: ['Owner', 'Manager'] },
    { icon: Users, label: 'Customers', path: '/customers', roles: ['Owner', 'Manager'] },
    { icon: Briefcase, label: 'Staff', path: '/staff', roles: ['Owner'] },
    { icon: Undo2, label: 'Returns', path: '/returns', roles: ['Owner', 'Manager'] },
    { icon: Percent, label: 'Discounts', path: '/discounts', roles: ['Owner', 'Manager'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['Owner', 'Manager'] },
    { icon: History, label: 'Audit Logs', path: '/logs', roles: ['Owner'] },
];

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: { isMobileOpen?: boolean, setIsMobileOpen?: (v: boolean) => void }) {
    const location = useLocation();
    const { logout, user } = useUser();
    const { businessName, logoUrl } = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    // Close mobile menu on route change
    useEffect(() => {
        if (isMobileOpen && setIsMobileOpen) {
            setIsMobileOpen(false);
        }
    }, [location.pathname]);

    // Filter items based on user role
    const filteredNavItems = navItems.filter(item =>
        !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <motion.div
            initial={false}
            animate={{
                width: isCollapsed && !isMobileOpen ? 80 : 256,
                x: isMobileOpen ? 0 : 0 // Controlled by class in mobile
            }}
            className={cn(
                "h-full border-r flex flex-col shadow-sm transition-all duration-300 ease-in-out bg-white border-slate-200 z-50",
                // Mobile styles
                "fixed inset-y-0 left-0 md:relative md:flex",
                !isMobileOpen && "hidden md:flex"
            )}
        >
            {/* Smart Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "absolute -right-3 top-10 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-colors z-50",
                    "bg-white border-slate-200 text-slate-400 hover:text-primary"
                )}
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Header / Logo Section */}
            <div className={cn(
                "p-6 flex items-center gap-3 overflow-hidden",
                isCollapsed && "justify-center px-0"
            )}>
                <div className={cn("p-2 rounded-lg shrink-0", "bg-primary")}>
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                    ) : (
                        <Store className="w-6 h-6 text-white" />
                    )}
                </div>
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="whitespace-nowrap"
                        >
                            <h1 className={cn("font-bold text-xl leading-none", "text-slate-800")}>
                                {businessName || "TRUST"}
                            </h1>
                            <span className={cn("text-xs font-medium", "text-slate-500")}>
                                Kampala Branch
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none">
                {filteredNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative group",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                    : "text-slate-500 hover:bg-accent hover:text-primary",
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                                isActive ? "text-primary-foreground" : "text-slate-400 group-hover:text-primary"
                            )} />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-3 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-xl">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Section */}
            <div className={cn(
                "p-4 border-t space-y-1",
                "border-slate-100",
                isCollapsed && "px-3"
            )}>
                {(user?.role === 'Owner' || user?.role === 'Manager' || user?.role === 'Cashier') && (
                    <Link
                        to="/settings"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group",
                            "text-slate-500 hover:bg-accent hover:text-primary",
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        <Settings className="w-5 h-5 shrink-0 transition-transform group-hover:rotate-45" />
                        {!isCollapsed && <span>Settings</span>}
                    </Link>
                )}
                <button
                    onClick={logout}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all mt-1 relative group",
                        isCollapsed && "justify-center px-0"
                    )}
                >
                    <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-1" />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </motion.div>
    );
}
