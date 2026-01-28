import { useState } from 'react';
import { Bell, Search, Plus, LogOut, RefreshCw, AlertCircle, CheckCircle, Info, XCircle, ShoppingBag, TrendingUp } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { useSearch } from '@/contexts/SearchContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSales } from '@/contexts/SalesContext';
import { cn } from '@/lib/utils';



export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
    const { user, logout } = useUser();
    const { showToast } = useToast();
    const { searchQuery, setSearchQuery } = useSearch();
    const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
    const { refreshStats } = useSales();
    const navigate = useNavigate();
    const [isSyncing, setIsSyncing] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const shortcuts = [
        { key: '/pos', label: 'Point of Sale', path: '/pos', icon: ShoppingBag },
        { key: '/reports', label: 'Financial Reports', path: '/reports', icon: TrendingUp },
        { key: '/inventory', label: 'Stock Inventory', path: '/inventory', icon: AlertCircle },
        { key: '/orders', label: 'Order History', path: '/orders', icon: Search },
        { key: '/settings', label: 'System Settings', path: '/settings', icon: Bell },
        { key: '/dashboard', label: 'Executive Dashboard', path: '/', icon: RefreshCw },
    ];


    if (!user) return null;

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await refreshStats();
            showToast('System synchronized successfully', 'success');
        } catch (error) {
            showToast('Sync failed. Please check connection', 'error');
        } finally {
            setTimeout(() => setIsSyncing(false), 1000); // Visual sustain
        }
    };

    const handleAction = () => {
        navigate('/pos');
        showToast('Ready for new sale', 'info');
    };



    return (
        <header className="h-[72px] bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-20 relative">
            {/* Mobile Menu Toggle */}
            <button
                onClick={onMenuClick}
                className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-xl mr-2 text-slate-500 active:bg-slate-200 transition-colors"
            >
                <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
                    <span className="w-full h-0.5 bg-slate-600 rounded-full"></span>
                    <span className="w-full h-0.5 bg-slate-600 rounded-full"></span>
                    <span className="w-full h-0.5 bg-slate-600 rounded-full"></span>
                </div>
            </button>

            <div className="flex items-center gap-2 md:gap-5 flex-1 justify-end">
                {/* Search Container */}
                <div className={cn(
                    "relative transition-all duration-300 flex items-center group",
                    searchOpen ? "w-full lg:w-80" : "w-10 lg:w-80"
                )}>
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="lg:hidden p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        {searchOpen ? <Plus className="w-5 h-5 rotate-45" /> : <Search className="w-5 h-5" />}
                    </button>

                    <div className={cn(
                        "absolute left-0 lg:relative flex items-center w-full transition-all duration-300",
                        searchOpen ? "translate-x-0 opacity-100 visible" : "translate-x-4 opacity-0 invisible lg:opacity-100 lg:visible lg:translate-x-0"
                    )}>
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-300 group-focus-within:text-blue-500 transition-colors hidden lg:block" />
                        <input
                            type="text"
                            placeholder="Type / for shortcuts or search..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowShortcuts(e.target.value.startsWith('/'));
                            }}
                            onFocus={() => searchQuery.startsWith('/') && setShowShortcuts(true)}
                            onBlur={() => setTimeout(() => setShowShortcuts(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchQuery.startsWith('/')) {
                                    const match = shortcuts.find(s => s.key === searchQuery.toLowerCase());
                                    if (match) {
                                        navigate(match.path);
                                        setSearchQuery('');
                                        setShowShortcuts(false);
                                    }
                                }
                            }}
                            className="pl-4 lg:pl-11 pr-5 py-[11px] bg-slate-50/50 border border-slate-100 lg:border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 w-full transition-all placeholder:text-slate-400 placeholder:font-normal font-medium text-slate-700"
                        />

                        {showShortcuts && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 z-50 animate-in slide-in-from-top-2">
                                <p className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Command Center Shortcuts</p>
                                <div className="space-y-1">
                                    {shortcuts.filter(s => s.key.includes(searchQuery.toLowerCase())).map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() => {
                                                navigate(s.path);
                                                setSearchQuery('');
                                                setShowShortcuts(false);
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                                    <s.icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-300 group-hover:text-white">{s.label}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-blue-400">{s.key}</span>
                                        </button>
                                    ))}
                                    {shortcuts.filter(s => s.key.includes(searchQuery.toLowerCase())).length === 0 && (
                                        <p className="px-3 py-4 text-[10px] font-bold text-slate-600 text-center italic">No command matches</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={cn("flex items-center gap-2 md:gap-4 transition-all duration-300", searchOpen && "hidden md:flex")}>
                    <button
                        onClick={handleSync}
                        className={cn(
                            "flex items-center gap-2.5 px-3 md:px-4 py-[10px] bg-white border border-slate-200 rounded-xl text-[14px] font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm ring-primary/20",
                            isSyncing && "ring-4 border-primary/40"
                        )}
                    >
                        <RefreshCw className={cn("w-[18px] h-[18px] text-slate-400", isSyncing && "animate-spin text-primary")} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>

                    <button
                        onClick={handleAction}
                        className="flex items-center gap-2 px-4 md:px-5 py-[11px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-[14px] font-black shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all"
                    >
                        <Plus className="w-[20px] h-[20px]" />
                        <span className="hidden lg:inline">New Sale</span>
                    </button>
                </div>

                <div className="h-10 w-px bg-slate-100 mx-1"></div>

                <div className="relative">
                    <button
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-full transition-all hover:text-slate-700 group"
                    >
                        <Bell className="w-6 h-6 stroke-[1.5]" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-[10px] h-[10px] bg-red-500 rounded-full border-2 border-white shadow-sm group-hover:scale-110 transition-transform"></span>
                        )}
                    </button>


                    {notificationsOpen && (
                        <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-3">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <h3 className="font-bold text-slate-800">Notifications</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => {
                                            clearAll();
                                            setNotificationsOpen(false);
                                        }}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-sm">No notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                markAsRead(n.id);
                                                if (n.link) navigate(n.link);
                                                setNotificationsOpen(false);
                                            }}
                                            className={cn(
                                                "flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group relative",
                                                !n.read && "bg-blue-50/30"
                                            )}
                                        >
                                            {/* Notification Icon based on type */}
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                n.type === 'error' ? "bg-red-50 text-red-600" :
                                                    n.type === 'warning' ? "bg-orange-50 text-orange-600" :
                                                        n.type === 'success' ? "bg-emerald-50 text-emerald-600" :
                                                            "bg-blue-50 text-blue-600"
                                            )}>
                                                {n.type === 'error' ? <XCircle className="w-5 h-5" /> :
                                                    n.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                                                        n.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                                                            <Info className="w-5 h-5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-slate-800 text-sm truncate">{n.title}</p>
                                                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>}
                                                </div>
                                                <p className="text-slate-500 text-xs line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </div>

                <div className="flex items-center gap-4 pl-3">
                    <Link to="/settings" className="relative group">
                        <div className="w-11 h-11 rounded-full bg-slate-100 ring-2 ring-white shadow-md overflow-hidden group-hover:ring-blue-100 transition-all">
                            <img
                                src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </Link>
                    <div className="hidden lg:block">
                        <p className="text-[14px] font-extrabold text-slate-800 leading-tight">{user.name}</p>
                        <p className="text-[12px] font-bold text-slate-400 capitalize tracking-tight">{user.role}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                        title="Logout"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                    </button>
                </div>
            </div>
        </header>
    );
}

