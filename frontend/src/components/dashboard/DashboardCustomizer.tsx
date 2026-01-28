import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Eye, EyeOff, LayoutTemplate, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetConfig {
    id: string;
    label: string;
    isVisible: boolean;
}

interface DashboardCustomizerProps {
    widgets: WidgetConfig[];
    onUpdate: (widgets: WidgetConfig[]) => void;
}

export default function DashboardCustomizer({ widgets, onUpdate }: DashboardCustomizerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);

    useEffect(() => {
        setLocalWidgets(widgets);
    }, [widgets]);

    const toggleWidget = (id: string) => {
        const updated = localWidgets.map(w =>
            w.id === id ? { ...w, isVisible: !w.isVisible } : w
        );
        setLocalWidgets(updated);
        onUpdate(updated);
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary/50 transition-all shadow-sm"
            >
                <Settings2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Customize Layout</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-end sm:justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 sm:mr-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <LayoutTemplate className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Dashboard Layout</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toggle Visibility</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {localWidgets.map((widget) => (
                                    <div
                                        key={widget.id}
                                        onClick={() => toggleWidget(widget.id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98]",
                                            widget.isVisible
                                                ? "bg-white border-primary/20 shadow-sm"
                                                : "bg-slate-50 border-slate-100 opacity-70 grayscale"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-4 h-4 rounded-full flex items-center justify-center border",
                                                widget.isVisible
                                                    ? "bg-primary border-primary text-white"
                                                    : "bg-transparent border-slate-300"
                                            )}>
                                                {widget.isVisible && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                            <span className={cn(
                                                "text-xs font-bold uppercase tracking-wider",
                                                widget.isVisible ? "text-slate-800" : "text-slate-400"
                                            )}>
                                                {widget.label}
                                            </span>
                                        </div>
                                        {widget.isVisible ? (
                                            <Eye className="w-4 h-4 text-primary opacity-50" />
                                        ) : (
                                            <EyeOff className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <p className="text-[10px] text-center text-slate-400 font-medium">Changes are saved automatically.</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
