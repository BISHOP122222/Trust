import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { useUser } from '@/contexts/UserContext';
import { motion } from 'framer-motion';

export default function Login() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { login } = useUser();

    // State
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const loggedInUser = await login(email, password, remember);

        if (loggedInUser) {
            showToast('Login successful! Redirecting...', 'success');
            // Role-based redirect
            if (loggedInUser.role === 'Cashier') {
                navigate('/sales');
            } else {
                navigate('/dashboard');
            }
        } else {
            showToast('Invalid email or password.', 'error');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Abstract Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl shadow-slate-900/30 mb-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent"></div>
                        <LayoutGrid className="w-10 h-10 relative z-10" />
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text">TRUST</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Point of Sale System</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Enterprise Retail Management</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-8 md:p-10 space-y-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Welcome Back</h2>
                            <p className="text-sm text-slate-400 mt-1 font-medium">Sign in to access your TRUST dashboard</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                        placeholder="admin@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                                    <Link to="/forgot-password" tabIndex={-1} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot Password?</Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 px-1">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none">Keep me signed in</label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={cn(
                                    "w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 transition-all transform active:scale-[0.98]",
                                    isLoading && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? "Authenticating..." : "Sign In to TRUST"}
                            </button>
                        </form>
                    </div>

                    <div className="px-8 pb-8 pt-0 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            Secured by Enterprise-Grade Encryption <br />
                            <span className="opacity-70">TRUST POS v2.4.0 • Business Intelligence Platform</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
