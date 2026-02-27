"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
    className?: string;
    isDarkTheme?: boolean;
}

export function Logo({ className, isDarkTheme }: LogoProps) {
    return (
        <motion.div
            className={cn("group flex items-center gap-3 cursor-pointer", className)}
            initial="initial"
            whileHover="hover"
        >
            <motion.div
                className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand to-slate-900 shadow-md border border-gold/30"
                variants={{
                    initial: { rotate: 0, scale: 1 },
                    hover: { rotate: 5, scale: 1.05, boxShadow: "0px 10px 20px rgba(212, 175, 55, 0.2)" }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <motion.div
                    className="absolute inset-0 bg-gold/10"
                    variants={{
                        initial: { opacity: 0 },
                        hover: { opacity: 1 }
                    }}
                />
                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 relative z-10"
                    variants={{
                        initial: { color: "var(--color-gold)" },
                        hover: { color: "#ffffff" }
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </motion.svg>
            </motion.div>
            <div className="flex flex-col">
                <span
                    className={cn(
                        "font-heading text-2xl font-bold leading-none tracking-tight transition-colors group-hover:text-brand",
                        // Always use white when on a dark/transparent hero background
                        // Otherwise: dark navy in light mode, white in dark mode
                        isDarkTheme ? "text-white" : "text-slate-900 dark:text-slate-100"
                    )}
                >
                    Ignacio
                </span>
                <span className={cn(
                    "font-brand text-[9px] font-medium uppercase tracking-[0.25em] mt-0.5 transition-colors",
                    isDarkTheme ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                )}>
                    Propiedades
                </span>
            </div>
        </motion.div>
    );
}
