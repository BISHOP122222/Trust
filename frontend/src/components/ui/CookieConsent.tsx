import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('trust_cookie_consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('trust_cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('trust_cookie_consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-50"
                >
                    <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-900/20 border border-slate-100 p-6 md:p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <Cookie className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cookie Consent</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                                    We use cookies to enhance your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                                </p>
                            </div>
                            <button onClick={handleDecline} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleAccept}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                                Accept All Cookies
                            </button>
                            <div className="flex items-center justify-between px-2">
                                <button onClick={handleDecline} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Decline unnecessary</button>
                                <Link to="/privacy-policy" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Privacy Policy</Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
