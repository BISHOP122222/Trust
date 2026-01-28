import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Store, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();
    const { showToast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            showToast('Invalid or missing reset token', 'error');
            navigate('/login');
        }
    }, [token, navigate, showToast]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            return showToast('Password must be at least 6 characters', 'error');
        }

        if (password !== confirmPassword) {
            return showToast('Passwords do not match', 'error');
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { token, password });
            setIsSuccess(true);
            showToast('Password reset successful!', 'success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Success!</h2>
                    <p className="mt-4 text-slate-500 font-medium font-inter">
                        Your password has been reset successfully. Redirecting you to the login page...
                    </p>
                    <div className="mt-8">
                        <Link
                            to="/login"
                            className="text-sm font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                        >
                            Return to Login Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200">
                        <Store className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
                    Set New Password
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    Choose a strong password to secure your account.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200 sm:rounded-[2rem] sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleResetPassword}>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
