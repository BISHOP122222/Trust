import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Store, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';

export default function ForgotPassword() {
    const { showToast } = useToast();
    const [step, setStep] = useState(1); // 1: Email, 2: Success Message
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            showToast('Password reset link sent to your email', 'success');
            setStep(2);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to send reset link', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200">
                        <Store className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
                    {step === 1 ? 'Forgot Password?' : 'Check Your Email'}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    {step === 1
                        ? 'Enter your email to receive a secure password reset link.'
                        : `We've sent a recovery link to ${email}`}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200 sm:rounded-[2rem] sm:px-10 border border-slate-100">
                    {step === 1 ? (
                        <form className="space-y-6" onSubmit={handleSendLink}>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-black text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="bg-green-50 p-4 rounded-full">
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                                Please check your inbox and click the link to reset your password.
                                The link will expire in 15 minutes.
                            </p>
                            <button
                                onClick={() => setStep(1)}
                                className="w-full text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                            >
                                Didn't get the email? Try again
                            </button>
                        </div>
                    )}

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
