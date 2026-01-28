import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

export type ThemeName = 'BLUE' | 'GREEN' | 'ORANGE' | 'PURPLE' | 'CUSTOM';

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
}

interface ThemeContextType {
    currentTheme: ThemeName;
    themeColors: ThemeColors;
    businessName: string;
    logoUrl: string | null;
    setTheme: (theme: ThemeName) => void;
    setCustomColors: (colors: Partial<ThemeColors>) => void;
    fetchBrandingTheme: () => Promise<void>;
}

const defaultTheme: ThemeColors = {
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#60a5fa',
    background: '#eff6ff'
};

const themePresets: Record<ThemeName, ThemeColors> = {
    BLUE: {
        primary: '#2563eb',
        secondary: '#1e40af',
        accent: '#60a5fa',
        background: '#eff6ff'
    },
    GREEN: {
        primary: '#059669',
        secondary: '#047857',
        accent: '#34d399',
        background: '#f0fdf4'
    },
    ORANGE: {
        primary: '#ea580c',
        secondary: '#c2410c',
        accent: '#fb923c',
        background: '#fff7ed'
    },
    PURPLE: {
        primary: '#7c3aed',
        secondary: '#6d28d9',
        accent: '#a78bfa',
        background: '#faf5ff'
    },
    CUSTOM: defaultTheme
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
        const saved = localStorage.getItem('trustpos_theme');
        return (saved as ThemeName) || 'BLUE';
    });

    const [themeColors, setThemeColors] = useState<ThemeColors>(() => {
        const savedColors = localStorage.getItem('trustpos_custom_colors');
        return savedColors ? JSON.parse(savedColors) : themePresets[currentTheme];
    });

    const [businessName, setBusinessName] = useState<string>('TRUST POS');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Helper to convert Hex to HSL for Shadcn/Tailwind
    const hexToHSL = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '222.2 47.4% 11.2%'; // Fallback

        let r = parseInt(result[1], 16) / 255;
        let g = parseInt(result[2], 16) / 255;
        let b = parseInt(result[3], 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        return `${h} ${s}% ${l}%`;
    };

    // Apply CSS variables
    const applyCSSVariables = (colors: ThemeColors) => {
        const root = document.documentElement;

        // Custom CSS Variables
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-secondary', colors.secondary);
        root.style.setProperty('--color-accent', colors.accent);
        root.style.setProperty('--color-background', colors.background);

        // Shadcn UI Variables (HSL format)
        const primaryHSL = hexToHSL(colors.primary);
        const secondaryHSL = hexToHSL(colors.secondary);
        const accentHSL = hexToHSL(colors.accent);
        const backgroundHSL = hexToHSL(colors.background);



        root.style.setProperty('--primary', primaryHSL);
        root.style.setProperty('--ring', primaryHSL);
        root.style.setProperty('--secondary', secondaryHSL);
        root.style.setProperty('--accent', accentHSL);
        root.style.setProperty('--background', backgroundHSL);
        // Ensure muted/destructives are visible against new backgrounds? 
        // For now, only overriding the core brand colors as per requirements.

        // Update RGB values for variants (legacy support)
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        const primaryRgb = hexToRgb(colors.primary);
        if (primaryRgb) {
            root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
        }
    };

    useEffect(() => {
        applyCSSVariables(themeColors);
    }, [themeColors]);

    const setTheme = (theme: ThemeName) => {
        setCurrentTheme(theme);
        localStorage.setItem('trustpos_theme', theme);

        if (theme !== 'CUSTOM') {
            const colors = themePresets[theme];
            setThemeColors(colors);
            applyCSSVariables(colors);
        }
    };

    const setCustomColors = (colors: Partial<ThemeColors>) => {
        const newColors = { ...themeColors, ...colors };
        setThemeColors(newColors);
        setCurrentTheme('CUSTOM');
        localStorage.setItem('trustpos_theme', 'CUSTOM');
        localStorage.setItem('trustpos_custom_colors', JSON.stringify(newColors));
        applyCSSVariables(newColors);
    };

    const fetchBrandingTheme = async () => {
        try {
            const response = await api.get('/branding');
            if (response.data) {
                const { theme, enableCustomTheme, primaryColor, secondaryColor, accentColor, businessName, logoUrl } = response.data;

                if (businessName) setBusinessName(businessName);
                if (logoUrl) {
                    const fullLogoUrl = logoUrl.startsWith('/uploads')
                        ? 'http://localhost:5000' + logoUrl
                        : logoUrl;
                    setLogoUrl(fullLogoUrl);
                }

                if (enableCustomTheme && primaryColor && secondaryColor && accentColor) {
                    const customColors: ThemeColors = {
                        primary: primaryColor,
                        secondary: secondaryColor,
                        accent: accentColor,
                        background: themePresets.BLUE.background
                    };
                    setThemeColors(customColors);
                    setCurrentTheme('CUSTOM');
                } else if (theme && theme in themePresets) {
                    setTheme(theme as ThemeName);
                }
            }
        } catch (error) {
            console.error('Failed to fetch branding theme:', error);
        }
    };

    useEffect(() => {
        fetchBrandingTheme();
    }, []);

    return (
        <ThemeContext.Provider value={{ currentTheme, themeColors, businessName, logoUrl, setTheme, setCustomColors, fetchBrandingTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
