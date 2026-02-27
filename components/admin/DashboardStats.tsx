"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle, MessageSquare, ImageOff, TrendingUp, Eye } from "lucide-react";

interface StatsData {
    pendingApproval: number;
    publishedCount: number;
    unreadMessages: number;
    withoutImages: number;
    totalViews: number;
    viewsTrend: number; // percentage change
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

export function DashboardStats({ stats }: { stats: StatsData }) {
    const cards = [
        {
            label: "Pendientes de Aprobación",
            value: stats.pendingApproval,
            icon: Clock,
            gradient: "from-amber-500/10 to-orange-500/10",
            iconColor: "text-amber-400",
            href: "/admin/propiedades?status=pending"
        },
        {
            label: "Publicadas",
            value: stats.publishedCount,
            icon: CheckCircle,
            gradient: "from-emerald-500/10 to-green-500/10",
            iconColor: "text-emerald-400",
            href: "/admin/propiedades?status=approved"
        },
        {
            label: "Mensajes Nuevos",
            value: stats.unreadMessages,
            icon: MessageSquare,
            gradient: "from-blue-500/10 to-indigo-500/10",
            iconColor: "text-blue-400",
            href: "/admin/mensajes"
        },
        {
            label: "Sin Imágenes",
            value: stats.withoutImages,
            icon: ImageOff,
            gradient: "from-red-500/10 to-rose-500/10",
            iconColor: "text-red-400",
            href: "/admin/propiedades"
        },
        {
            label: "Visitas Totales (7d)",
            value: stats.totalViews,
            icon: Eye,
            gradient: "from-violet-500/10 to-purple-500/10",
            iconColor: "text-violet-400",
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
            {cards.map((card) => (
                <motion.a
                    key={card.label}
                    href={card.href || "#"}
                    variants={item}
                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                    className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-2xl p-5 group cursor-pointer`}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-2.5 rounded-xl bg-slate-800/50 ${card.iconColor}`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                        {card.suffix && (
                            <span className={`text-xs font-semibold flex items-center gap-1 ${card.suffixColor}`}>
                                {card.suffixIcon && <card.suffixIcon className="w-3 h-3" />}
                                {card.suffix}
                            </span>
                        )}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1 tracking-tight">
                        {card.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                        {card.label}
                    </div>
                </motion.a>
            ))}
        </motion.div>
    );
}
