"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    compact?: boolean;
}

export function EmptyState({ icon: Icon, title, subtitle, action, compact }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col items-center justify-center text-center ${compact ? "py-6" : "py-12"}`}
        >
            <div className={`${compact ? "w-10 h-10" : "w-14 h-14"} rounded-2xl bg-slate-800/60 flex items-center justify-center mb-3`}>
                <Icon className={`${compact ? "w-5 h-5" : "w-7 h-7"} text-slate-500`} />
            </div>
            <h4 className={`font-semibold text-slate-400 mb-1 ${compact ? "text-xs" : "text-sm"}`}>
                {title}
            </h4>
            {subtitle && (
                <p className={`text-slate-500 max-w-xs ${compact ? "text-[11px]" : "text-xs"}`}>
                    {subtitle}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    );
}
