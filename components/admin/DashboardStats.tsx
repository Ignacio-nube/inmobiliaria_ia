"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Clock, CheckCircle, MessageSquare, ImageOff, TrendingUp, Eye } from "lucide-react";

interface StatsData {
    pendingApproval: number;
    publishedCount: number;
    unreadMessages: number;
    withoutImages: number;
    totalViews: number;
    viewsTrend: number;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 }
};

function AnimatedCounter({ value }: { value: number }) {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94],
        });
        return controls.stop;
    }, [count, value]);

    return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function DashboardStats({ stats }: { stats: StatsData }) {
    const cards = [
        {
            label: "Pendientes de Aprobación",
            value: stats.pendingApproval,
            icon: Clock,
            gradient: "from-amber-500/10 to-orange-500/10",
            iconColor: "text-amber-400",
            glowColor: "hover:shadow-amber-500/20",
            borderGlow: "hover:border-amber-500/30",
            href: "#approval-queue"
        },
        {
            label: "Publicadas",
            value: stats.publishedCount,
            icon: CheckCircle,
            gradient: "from-emerald-500/10 to-green-500/10",
            iconColor: "text-emerald-400",
            glowColor: "hover:shadow-emerald-500/20",
            borderGlow: "hover:border-emerald-500/30",
            href: "/admin/propiedades?status=approved"
        },
        {
            label: "Mensajes Nuevos",
            value: stats.unreadMessages,
            icon: MessageSquare,
            gradient: "from-blue-500/10 to-indigo-500/10",
            iconColor: "text-blue-400",
            glowColor: "hover:shadow-blue-500/20",
            borderGlow: "hover:border-blue-500/30",
            href: "/admin/mensajes"
        },
        {
            label: "Sin Imágenes",
            value: stats.withoutImages,
            icon: ImageOff,
            gradient: "from-red-500/10 to-rose-500/10",
            iconColor: "text-red-400",
            glowColor: "hover:shadow-red-500/20",
            borderGlow: "hover:border-red-500/30",
            href: "/admin/propiedades"
        },
        {
            label: "Visitas (7d)",
            value: stats.totalViews,
            icon: Eye,
            gradient: "from-violet-500/10 to-purple-500/10",
            iconColor: "text-violet-400",
            glowColor: "hover:shadow-violet-500/20",
            borderGlow: "hover:border-violet-500/30",
            suffix: stats.viewsTrend > 0 ? `+${stats.viewsTrend}%` : `${stats.viewsTrend}%`,
            suffixIcon: TrendingUp,
            suffixColor: stats.viewsTrend >= 0 ? "text-emerald-400" : "text-red-400"
        },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
        >
            {cards.map((card) => (
                <motion.a
                    key={card.label}
                    href={card.href || "#"}
                    variants={item}
                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                    className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-2xl p-4 group cursor-pointer border border-transparent ${card.borderGlow} transition-all duration-300 shadow-lg shadow-transparent ${card.glowColor}`}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-xl bg-slate-800/50 ${card.iconColor}`}>
                            <card.icon className="w-4 h-4" />
                        </div>
                        {card.suffix && (
                            <span className={`text-xs font-semibold flex items-center gap-1 ${card.suffixColor}`}>
                                {card.suffixIcon && <card.suffixIcon className="w-3 h-3" />}
                                {card.suffix}
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-white mb-0.5 tracking-tight">
                        <AnimatedCounter value={card.value} />
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                        {card.label}
                    </div>
                </motion.a>
            ))}
        </motion.div>
    );
}
