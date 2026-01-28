import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Simple Dropdown implementation for premium UI components

interface SimpleDropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

export function SimpleDropdown({ trigger, children, align = 'right' }: SimpleDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>
            {isOpen && (
                <div className={cn(
                    "absolute z-50 mt-2 min-w-[10rem] overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 text-slate-950 shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200 origin-top-right",
                    align === 'right' ? "right-0" : "left-0"
                )}>
                    {children}
                </div>
            )}
        </div>
    );
}

export function DropdownMenuItem({ children, onClick, className, variant = 'default' }: { children: React.ReactNode, onClick?: () => void, className?: string, variant?: 'default' | 'destructive' }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-widest outline-none transition-colors focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-slate-50",
                variant === 'destructive' ? "text-red-600 hover:bg-red-50 hover:text-red-700" : "text-slate-600",
                className
            )}
        >
            {children}
        </button>
    );
}

export function DropdownMenuSeparator() {
    return <div className="-mx-1 my-1 h-px bg-slate-100" />;
}
