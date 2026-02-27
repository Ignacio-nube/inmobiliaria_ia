"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Placeholder to avoid layout shift — always dark context so use white
        return <div className="w-8 h-8" />;
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            // Always white icons since the header is always dark
            className="relative flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white transition-colors duration-200"
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-label="Toggle theme"
        >
            <Sun className={`h-[18px] w-[18px] transition-all duration-300 ${isDark ? "rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100"}`} />
            <Moon className={`h-[18px] w-[18px] transition-all duration-300 ${isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0 opacity-0 absolute"}`} />
        </button>
    );
}
