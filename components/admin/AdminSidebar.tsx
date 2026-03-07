"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Building2, Settings, Home, Mail, ChevronRight, BarChart3, Globe, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminSidebarProps {
    pendingCount?: number;
    unreadMessages?: number;
}

export function AdminSidebar({ pendingCount = 0, unreadMessages = 0 }: AdminSidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    // Auto-collapse on small screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1280) {
                setCollapsed(true);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        {
            name: "Propiedades", href: "/admin/propiedades", icon: Building2,
            badge: pendingCount > 0 ? pendingCount : undefined,
            badgeColor: "bg-amber-500/20 text-amber-400"
        },
        {
            name: "Mensajes", href: "/admin/mensajes", icon: Mail,
            badge: unreadMessages > 0 ? unreadMessages : undefined,
            badgeColor: "bg-blue-500/20 text-blue-400"
        },
        { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { name: "Scraping", href: "/admin/scraping", icon: Globe },
        { name: "Sitio y CMS", href: "/admin/settings", icon: Settings },
    ];

    return (
        <aside className={`${collapsed ? "w-[72px]" : "w-72"} bg-[#070c1a] text-slate-300 flex flex-col pt-10 rounded-r-3xl shadow-2xl overflow-hidden relative transition-all duration-300`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Logo */}
            <div className={`${collapsed ? "px-4 justify-center" : "px-7"} mb-8 relative z-10 flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-amber-500 flex items-center justify-center text-black shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </div>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1"
                    >
                        <h2 className="text-xl font-bold tracking-tight text-white leading-tight">Admin</h2>
                        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Ignacio Prop.</p>
                    </motion.div>
                )}
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className={`${collapsed ? "mx-auto" : "mx-4"} mb-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all relative z-10`}
                title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <nav className={`flex-1 w-full ${collapsed ? "px-2" : "px-4"} space-y-1 relative z-10`}>
                {navItems.map((item) => {
                    const isActive = item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} ${collapsed ? "px-2" : "px-4"} py-3 rounded-2xl text-sm font-medium transition-all group relative overflow-hidden ${isActive
                                ? "text-white"
                                : "text-slate-400 hover:text-white"
                                }`}
                            title={collapsed ? item.name : undefined}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-slate-800/70 rounded-2xl"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}

                            <div className="flex items-center gap-3 relative z-10">
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span>{item.name}</span>}
                            </div>

                            {!collapsed && (
                                <div className="flex items-center gap-2 relative z-10">
                                    {item.badge && (
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            <ChevronRight className="w-4 h-4 text-amber-400" />
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Badge on collapsed mode */}
                            {collapsed && item.badge && (
                                <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center z-20 ${item.badgeColor}`}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className={`w-full ${collapsed ? "p-2" : "p-4"} mt-auto relative z-10`}>
                <Link
                    href="/"
                    className={`flex items-center ${collapsed ? "justify-center" : ""} gap-3 ${collapsed ? "px-2" : "px-4"} py-3 rounded-2xl text-sm font-medium text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all group`}
                    title={collapsed ? "Volver al Sitio Web" : undefined}
                >
                    <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
                    {!collapsed && <span>Volver al Sitio Web</span>}
                </Link>
            </div>
        </aside>
    );
}
