import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <div className="mb-8 flex items-center justify-between">
                    <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to System
                    </Link>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">GDPR Compliant</span>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="p-8 md:p-12">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4 uppercase">Privacy Policy</h1>
                        <p className="text-slate-500 font-medium mb-12">Last Updated: February 1, 2026</p>

                        <div className="space-y-12">
                            <section>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                                        <Eye className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">1. Data Collection</h2>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    TRUST POS collects minimal personal data required for operational efficiency. This includes your name, business email, phone number, and system login credentials. We do not track personal activities outside of system-related actions (e.g., sales processing, inventory management).
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">2. Data Security</h2>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-medium">
                                    Your data is encrypted using industry-standard protocols. We implement multi-layered defenses including XSS sanitization, CSRF protection, and rate limiting to prevent unauthorized access and data breaches.
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">3. Your Rights (GDPR)</h2>
                                </div>
                                <ul className="space-y-4 text-slate-600 font-medium">
                                    <li className="flex gap-3 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                        <span><strong>Right to Access:</strong> You can request a copy of your personal data at any time via the Settings panel.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                        <span><strong>Right to Erasure:</strong> You can request the deletion of your account and associated personal data.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                        <span><strong>Data Portability:</strong> Your data can be exported in a machine-readable format (JSON) for your own use.</span>
                                    </li>
                                </ul>
                            </section>

                            <section className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">4. Contact Our DPO</h2>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    If you have any questions regarding your data privacy or would like to exercise your rights, please contact our Data Protection Officer through the support form in the system settings or email us at support@trustpos.com.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
